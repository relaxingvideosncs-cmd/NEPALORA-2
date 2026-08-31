import Image from "next/image";
import Link from "next/link";
import { Badge } from "./Badge";

interface PostCardProps {
  href: string;
  title: string;
  excerpt: string;
  category: string;
  coverImage?: string;
  date: string;
  readTime: string;
  featured?: boolean;
}

// NYT-style editorial card: hairline separation, no heavy shadow,
// image is quiet until hover. The featured variant is the one
// place per page allowed to be larger/bolder — everything else
// stays disciplined so the featured post actually reads as important.

export function PostCard({
  href,
  title,
  excerpt,
  category,
  coverImage,
  date,
  readTime,
  featured = false,
}: PostCardProps) {
  return (
    <Link
      href={href}
      className={`
        group block reveal
        ${featured ? "md:col-span-2" : ""}
      `}
    >
      {coverImage && (
        <div
          className={`
            relative overflow-hidden rounded-md mb-4 bg-hairline
            ${featured ? "aspect-[16/9]" : "aspect-[4/3]"}
          `}
        >
          <Image
            src={coverImage}
            alt=""
            fill
            className="
              object-cover transition-transform duration-700 ease-out
              group-hover:scale-[1.04]
            "
          />
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <Badge tone={category === "opinion" ? "red" : "blue"}>{category}</Badge>
        <span className="text-[12px] text-ink-tertiary">{date} · {readTime}</span>
      </div>

      <h3
        className={`
          font-display underline-draw
          ${featured ? "text-[28px] md:text-[34px]" : "text-[19px]"}
        `}
      >
        {title}
      </h3>

      <p className="text-ink-secondary text-[14px] mt-2 leading-relaxed line-clamp-2">
        {excerpt}
      </p>
    </Link>
  );
}
