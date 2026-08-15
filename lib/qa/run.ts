import { supabaseAdmin } from '@/lib/supabase/admin';
import { qaChecks } from './checks';
import { QAReport, QACheck } from '@/lib/types';

async function getEquirectAssets(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from('assets')
    .select('*')
    .eq('project_id', projectId)
    .eq('file_type', 'equirect');

  if (error) throw error;
  return data || [];
}

async function createQAReport(projectId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('qa_reports')
    .insert({
      project_id: projectId,
      qa_status: 'pending',
      checks: [],
      issues: [],
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function updateQAReport(reportId: string, updates: Partial<QAReport>) {
  const { error } = await supabaseAdmin
    .from('qa_reports')
    .update(updates)
    .eq('id', reportId);

  if (error) throw error;
}

export async function runQAChecks(projectId: string): Promise<{ jobId: string; reportId: string }> {
  const reportId = await createQAReport(projectId);
  const jobId = `qa_${reportId}`;

  // Start the async job
  runQAJob(jobId, reportId, projectId).catch(console.error);

  return { jobId, reportId };
}

async function runQAJob(jobId: string, reportId: string, projectId: string) {
  try {
    await updateQAReport(reportId, { qa_status: 'running' });

    const assets = await getEquirectAssets(projectId);
    
    if (assets.length === 0) {
      await updateQAReport(reportId, {
        qa_status: 'failed',
        checks: [],
        issues: ['No equirectangular assets found for this project'],
        checked_at: new Date(),
      });
      return;
    }

    // Run checks for each equirect asset
    const allChecks: QACheck[] = [];
    const allIssues: string[] = [];

    for (const asset of assets) {
      const assetChecks: QACheck[] = [];

      // Run all 5 checks in parallel for this asset
      const checkPromises = qaChecks.map(async (checkFn, index) => {
        try {
          const result = index === 0 
            ? await checkFn(asset.storage_path, asset.file_size)
            : await checkFn(asset.storage_path);
          return { ...result, assetId: asset.id, assetName: asset.file_name };
        } catch (error) {
          return {
            name: `Check ${index + 1}`,
            status: 'fail' as const,
            message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            assetId: asset.id,
            assetName: asset.file_name,
          };
        }
      });

      const results = await Promise.all(checkPromises);
      assetChecks.push(...results);

      // Collect issues from failed checks
      for (const check of results) {
        if (check.status === 'fail') {
          allIssues.push(`${check.assetName}: ${check.message}`);
        }
      }

      allChecks.push(...assetChecks);
    }

    // Determine overall status
    const hasFailures = allChecks.some(c => c.status === 'fail');
    const overallStatus = hasFailures ? 'failed' : 'passed';

    await updateQAReport(reportId, {
      qa_status: overallStatus,
      checks: allChecks,
      issues: allIssues,
      checked_at: new Date(),
    });

    // Update project status
    await supabaseAdmin
      .from('projects')
      .update({ 
        status: overallStatus === 'passed' ? 'qa_passed' : 'qa_pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

  } catch (error) {
    await updateQAReport(reportId, {
      qa_status: 'failed',
      checks: [],
      issues: [`QA job failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      checked_at: new Date(),
    });
  }
}

export async function getQAReport(reportId: string): Promise<QAReport | null> {
  const { data, error } = await supabaseAdmin
    .from('qa_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error || !data) return null;
  
  return {
    id: data.id,
    project_id: data.project_id,
    qa_status: data.qa_status,
    checks: data.checks || [],
    issues: data.issues || [],
    checked_at: data.checked_at ? new Date(data.checked_at) : undefined,
  };
}

export async function getQAJobStatus(jobId: string): Promise<{
  status: string;
  progress: number;
  report?: QAReport;
} | null> {
  // Extract report ID from job ID
  const reportId = jobId.replace('qa_', '');
  const report = await getQAReport(reportId);
  
  if (!report) return null;

  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'running': 'running',
    'passed': 'passed',
    'failed': 'failed',
  };

  return {
    status: statusMap[report.qa_status] || 'unknown',
    progress: report.qa_status === 'running' ? 50 : 100,
    report,
  };
}