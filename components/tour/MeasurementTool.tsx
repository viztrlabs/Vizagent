'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTourFeature, type CameraHeading } from '@/components/tour/TourFeatureContext';

export interface MeasurementPoint {
  yaw: number;
  pitch: number;
}

export interface MeasurementResult {
  distance: number;
  unit: 'meters';
}

const EARTH_RADIUS_M = 6371000;
const SCENE_RADIUS_M = 50;

export function calculateDistance(start: MeasurementPoint, end: MeasurementPoint): MeasurementResult {
  const deltaYaw = end.yaw - start.yaw;
  const deltaPitch = end.pitch - start.pitch;

  const chordLength =
    2 *
    Math.sin(Math.sqrt(deltaYaw * deltaYaw + deltaPitch * deltaPitch) / 2);

  const arcLength = 2 * Math.asin(Math.min(chordLength / 2, 1));
  const distance = arcLength * SCENE_RADIUS_M;

  return { distance, unit: 'meters' };
}

export interface MeasurementToolProps {
  onMeasureComplete?: (result: MeasurementResult) => void;
}

export function MeasurementTool({ onMeasureComplete }: MeasurementToolProps) {
  const { config, cameraHeading } = useTourFeature();
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [startPoint, setStartPoint] = useState<MeasurementPoint | null>(null);
  const [endPoint, setEndPoint] = useState<MeasurementPoint | null>(null);
  const [distance, setDistance] = useState<MeasurementResult | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isMeasuring) return;

      const point: MeasurementPoint = {
        yaw: cameraHeading.yaw,
        pitch: cameraHeading.pitch,
      };

      if (!startPoint) {
        setStartPoint(point);
      } else {
        setEndPoint(point);
        const result = calculateDistance(startPoint, point);
        setDistance(result);
        onMeasureComplete?.(result);
        setIsMeasuring(false);
        setStartPoint(null);
      }
    },
    [isMeasuring, startPoint, cameraHeading, onMeasureComplete]
  );

  const handleStart = () => {
    if (isMeasuring) {
      setIsMeasuring(false);
      setStartPoint(null);
      setEndPoint(null);
      setDistance(null);
    } else {
      setIsMeasuring(true);
      setStartPoint(null);
      setEndPoint(null);
      setDistance(null);
    }
  };

  const handleReset = () => {
    setIsMeasuring(false);
    setStartPoint(null);
    setEndPoint(null);
    setDistance(null);
  };

  const instructionText = useMemo(() => {
    if (!isMeasuring) return 'Click "Measure" to start';
    if (!startPoint) return 'Click on the scene to set the start point';
    return 'Click on the scene to set the end point (or reset to cancel)';
  }, [isMeasuring, startPoint]);

  return (
    <div
      className="viztr-measurement-tool"
      onClick={handleClick}
      role="presentation"
    >
      <button
        type="button"
        onClick={handleStart}
        className={`viztr-measure-button ${isMeasuring ? 'measuring' : ''}`}
        aria-pressed={isMeasuring}
      >
        {isMeasuring ? 'Cancel' : 'Measure'}
      </button>

      {isMeasuring && (
        <>
          {startPoint && !endPoint && (
            <div className="viztr-measure-status">
              <span className="viztr-measure-dot start" />
              <span className="viztr-measure-text">Start point set</span>
            </div>
          )}

          {startPoint && endPoint && distance && (
            <div className="viztr-measure-result">
              <span className="viztr-measure-distance">
                {distance.distance.toFixed(2)} {distance.unit}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="viztr-measure-reset"
              >
                ×
              </button>
            </div>
          )}
        </>
      )}

      {isMeasuring && (
        <div className="viztr-measure-instruction">{instructionText}</div>
      )}

      <style jsx>{`
        .viztr-measurement-tool {
          position: absolute;
          bottom: 80px;
          right: 16px;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .viztr-measure-button {
          padding: 8px 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: rgba(13, 17, 23, 0.85);
          color: #94a3b8;
          font-size: 13px;
          font-family: Inter, system-ui, sans-serif;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          backdrop-filter: blur(8px);
        }
        .viztr-measure-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e2e8f0;
        }
        .viztr-measure-button.measuring {
          background: rgba(13, 148, 136, 0.3);
          color: #fff;
        }
        .viztr-measure-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(13, 17, 23, 0.85);
          border-radius: 6px;
          font-size: 12px;
          font-family: Inter, system-ui, sans-serif;
          color: #94a3b8;
        }
        .viztr-measure-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .viztr-measure-dot.start {
          background: #06b6d4;
          box-shadow: 0 0 8px #06b6d4;
        }
        .viztr-measure-text {
          color: #94a3b8;
        }
        .viztr-measure-result {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(13, 17, 23, 0.9);
          border: 1px solid #0d9488;
          border-radius: 8px;
          font-size: 14px;
          font-family: Inter, system-ui, sans-serif;
          color: #fff;
        }
        .viztr-measure-distance {
          font-weight: 600;
          color: #06b6d4;
        }
        .viztr-measure-reset {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .viztr-measure-reset:hover {
          color: #94a3b8;
        }
        .viztr-measure-instruction {
          padding: 4px 12px;
          font-size: 11px;
          color: #64748b;
          font-family: Inter, system-ui, sans-serif;
        }
      `}</style>
    </div>
  );
}

MeasurementTool.displayName = 'MeasurementTool';
