import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle, ChevronRight } from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  tags: string[];
  updated_at: string;
  is_published: boolean;
}

interface KnowledgeBaseProps {
  data: Article[];
  isLoading?: boolean;
}

const categoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case "disease":
      return "bg-red-100 text-red-800";
    case "nutrition":
      return "bg-green-100 text-green-800";
    case "production":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function KnowledgeBase({ data, isLoading }: KnowledgeBaseProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Get unique categories
  const categories = Array.from(new Set(data.map((a) => a.category)));

  // Filter articles
  const filtered = data.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === null || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">No articles published</p>
        <p className="text-gray-400 text-sm mt-1">Articles will appear here once published</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search articles by title or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-600 self-center">Category:</span>
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded text-sm transition ${
            selectedCategory === null
              ? "bg-gray-900 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={`px-3 py-1 rounded text-sm transition ${
              selectedCategory === cat
                ? "bg-gray-900 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="text-sm text-gray-500">
        Found {filtered.length} article{filtered.length !== 1 ? "s" : ""} {selectedCategory ? `in ${selectedCategory}` : ""}
      </div>

      {/* Articles Grid/List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No matching articles</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition cursor-pointer group"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColor(item.category)}`}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition" />
                </div>
                <h3 className="font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{item.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Updated */}
                <div className="text-xs text-gray-500">
                  Updated {item.updated_at}
                </div>

                {/* Read Button */}
                <Button variant="outline" size="sm" className="w-full">
                  Read Article
                </Button>
              </div>

              {/* Expanded Details */}
              {expandedId === item.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">About</p>
                    <p className="text-sm text-gray-700">
                      This article provides guidance on {item.category.toLowerCase()} management and best practices.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                      <p className="text-gray-700 mt-1">{item.category}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Updated</p>
                      <p className="text-gray-700 mt-1">{item.updated_at}</p>
                    </div>
                  </div>
                  <Button size="sm" className="w-full">
                    Read Full Article
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
