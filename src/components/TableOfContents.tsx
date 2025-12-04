import React, { useEffect, useState } from "react";
import { List } from "lucide-react";

interface TableOfContentsProps {
  content: string;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  content,
}) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Parse headings from markdown
    const lines = content.split("\n");
    const extractedHeadings: Heading[] = [];

    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        // Create a simple ID from text
        const id = text.toLowerCase().replace(/[^\w]+/g, "-");
        extractedHeadings.push({ id, text, level });
      }
    });

    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -35% 0px" },
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveId(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4">
        <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white font-semibold">
          <List className="w-4 h-4" />
          <span className="text-sm uppercase tracking-wider">Contents</span>
        </div>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => scrollToHeading(heading.id)}
              className={`block w-full text-left text-sm py-1.5 px-3 rounded-lg transition-colors duration-200 ${
                activeId === heading.id
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              style={{ paddingLeft: `${heading.level * 0.75}rem` }}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
