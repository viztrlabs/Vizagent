'use client';

import React, { useState } from 'react';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  parentId: string | null;
  mentions: string[];
  createdAt: string;
  replies?: Comment[];
}

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  currentUserId: string;
  isStaff?: boolean;
}

export default function CommentThread({ comments, onAddComment, onDelete, currentUserId, isStaff }: CommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (parentId?: string) => {
    const content = parentId ? replyContent : '';
    // In a real app, this would call the API
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const isOwner = comment.authorId === currentUserId;
    const isReplying = replyingTo === comment.id;

    return (
      <div key={comment.id} className={`ml-${depth * 4} mb-4`}>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-gray-900">{comment.authorId}</span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-900 mb-2">{comment.content}</p>
              {comment.mentions.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {comment.mentions.map((mention) => (
                    <span key={mention} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      @{mention}
                    </span>
                  ))}
                </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Reply
                </button>
                {isStaff || comment.authorId === 'current_user' ? (
                  <button
                    onClick={() => { /* delete */ }}
                    className="text-sm text-red-600 hover:text-red-700 ml-2"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
            {replies && replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        </div>
      );
    };

    // This is a simplified version - in reality we'd need to handle the recursive rendering
    return (
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">{comment.authorId}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-900 mb-2">{comment.content}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { /* reply */ }}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
}

export default CommentThread;