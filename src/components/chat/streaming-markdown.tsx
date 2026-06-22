"use client";

import { useState, useEffect, useRef, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PROSE_CLASSES =
  "prose dark:prose-invert max-w-none marker:text-foreground [&_a]:text-primary [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h1]:text-xl [&_h1]:font-medium [&_h2]:text-lg [&_h2]:font-medium [&_h3]:text-base [&_h3]:font-medium [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:overflow-x-auto";

type StreamingMarkdownProps = {
  content: string;
  shouldStream: boolean;
};

function StreamingMarkdownInner({ content, shouldStream }: StreamingMarkdownProps) {
  const [displayedContent, setDisplayedContent] = useState(
    shouldStream ? "" : content
  );
  const [isStreaming, setIsStreaming] = useState(shouldStream);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!shouldStream) {
      setDisplayedContent(content);
      setIsStreaming(false);
      return;
    }

    // Split into words while preserving whitespace
    const words = content.split(/(\s+)/);
    let currentIndex = 0;

    // Batch 2-3 words at a time for a natural cadence
    animationRef.current = setInterval(() => {
      currentIndex += 2;
      const displayed = words.slice(0, currentIndex).join("");
      setDisplayedContent(displayed);

      if (currentIndex >= words.length) {
        if (animationRef.current) clearInterval(animationRef.current);
        setDisplayedContent(content);
        setIsStreaming(false);
      }
    }, 30);

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [content, shouldStream]);

  return (
    <div className={PROSE_CLASSES}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      {isStreaming && (
        <span className="streaming-cursor" />
      )}
    </div>
  );
}

export const StreamingMarkdown = memo(StreamingMarkdownInner);
