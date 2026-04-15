import { User } from "lucide-react";
import type { IBook } from "../types/book";

interface AuthorTabInfoProps {
  book: IBook;
  authorName: string;
}

const AuthorTabInfo = ({ book, authorName }: AuthorTabInfoProps) => {
  return (
    <>
      <div className="flex items-start gap-4 p-4 bg-[#0F172A] rounded-xl">
        {typeof book.author === "object" && book.author?.avatar ? (
          <img
            src={book.author.avatar}
            alt={authorName}
            className="w-16 h-16 rounded-full object-cover border-2 border-golden/75 flex-shrink-0"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full bg-golden/70 border-2 border-golden/75
                flex items-center justify-center flex-shrink-0"
          >
            <User size={28} className="text-golden/80" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <h3 className="text-slate-100 font-bold text-lg">{authorName}</h3>
          <p className="text-golden/80 text-xs font-semibold uppercase tracking-wider">
            {typeof book.author === "object" && book.author?.specialty?.length
              ? book.author.specialty[0]
              : book.category[0]}{" "}
            Author
          </p>
          <div className="flex items-center gap-4 mt-1">
            {[
              {
                value: `${book.purchaseCount.toLocaleString()}+`,
                label: "Readers",
              },
              {
                value: `${(book.rating ?? 0).toFixed(1)}★`,
                label: "Avg Rating",
              },
              { value: String(book.reviewCount ?? 0), label: "Reviews" },
            ].map((stat, i, arr) => (
              <div key={stat.label} className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-slate-200 font-bold text-sm">
                    {stat.value}
                  </p>
                  <p className="text-text-muted text-xs">{stat.label}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px h-8 bg-slate-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {typeof book.author === "object" && book.author?.bio ? (
        <p className="text-slate-400 text-sm leading-relaxed">
          {book.author.bio}
        </p>
      ) : (
        <p className="text-slate-400 text-sm leading-relaxed">
          <span className="text-slate-200 font-semibold">{authorName}</span> is
          a renowned author and expert in {book.category[0].toLowerCase()}. With
          years of experience and a passion for sharing knowledge, their works
          have helped thousands of readers worldwide advance their careers.
        </p>
      )}

      {typeof book.author === "object" && book.author?.socialLinks && (
        <div className="flex gap-3">
          {Object.entries(book.author.socialLinks)
            .filter(([, url]) => typeof url === "string" && url.length > 0)
            .map(([platform, url]) => (
              <a
                key={platform}
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost btn-sm capitalize"
              >
                {platform}
              </a>
            ))}
        </div>
      )}
    </>
  );
};

export default AuthorTabInfo;
