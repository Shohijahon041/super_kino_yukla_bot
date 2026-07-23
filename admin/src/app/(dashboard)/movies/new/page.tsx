"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { movies, genres, countries, languages } from "@/lib/api";
import type { Genre, Country, Language } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function NewMoviePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [genreList, setGenreList] = React.useState<Genre[]>([]);
  const [countryList, setCountryList] = React.useState<Country[]>([]);
  const [languageList, setLanguageList] = React.useState<Language[]>([]);

  const [form, setForm] = React.useState({
    title: "",
    description: "",
    poster: "",
    backdrop: "",
    trailer: "",
    year: new Date().getFullYear().toString(),
    duration: "",
    rating: "",
    imdbRating: "",
    status: "draft",
    genreIds: [] as string[],
    countryIds: [] as string[],
    languageIds: [] as string[],
  });

  React.useEffect(() => {
    async function fetchMetadata() {
      try {
        const [genresRes, countriesRes, languagesRes] = await Promise.all([
          genres.getGenres(),
          countries.getCountries(),
          languages.getLanguages(),
        ]);
        setGenreList(genresRes.data);
        setCountryList(countriesRes.data);
        setLanguageList(languagesRes.data);
      } catch {
        setGenreList([
          { id: "1", name: "Action", slug: "action" },
          { id: "2", name: "Comedy", slug: "comedy" },
          { id: "3", name: "Drama", slug: "drama" },
          { id: "4", name: "Horror", slug: "horror" },
          { id: "5", name: "Sci-Fi", slug: "sci-fi" },
          { id: "6", name: "Thriller", slug: "thriller" },
          { id: "7", name: "Romance", slug: "romance" },
          { id: "8", name: "Animation", slug: "animation" },
        ]);
        setCountryList([
          { id: "1", name: "United States", code: "US" },
          { id: "2", name: "United Kingdom", code: "GB" },
          { id: "3", name: "France", code: "FR" },
          { id: "4", name: "Japan", code: "JP" },
          { id: "5", name: "South Korea", code: "KR" },
        ]);
        setLanguageList([
          { id: "1", name: "English", code: "en" },
          { id: "2", name: "Spanish", code: "es" },
          { id: "3", name: "French", code: "fr" },
          { id: "4", name: "Japanese", code: "ja" },
        ]);
      }
    }
    fetchMetadata();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await movies.createMovie({
        title: form.title,
        description: form.description,
        poster: form.poster,
        backdrop: form.backdrop,
        trailer: form.trailer,
        year: parseInt(form.year),
        duration: parseInt(form.duration) * 60,
        rating: parseFloat(form.rating),
        imdbRating: form.imdbRating ? parseFloat(form.imdbRating) : undefined,
        status: form.status as "published" | "draft" | "archived",
        genres: genreList.filter((g) => form.genreIds.includes(g.id)),
        countries: countryList.filter((c) => form.countryIds.includes(c.id)),
        languages: languageList.filter((l) => form.languageIds.includes(l.id)),
      });
      addToast({ title: "Movie created", description: "The movie has been created successfully.", variant: "success" });
      router.push("/movies");
    } catch {
      addToast({ title: "Error", description: "Failed to create movie.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string): string[] => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Movie</h1>
        <p className="text-gray-400 mt-1">Create a new movie entry</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Movie title"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Year *</label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  min="1900"
                  max="2030"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Description *</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Movie description"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Duration (minutes) *</label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="120"
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Rating *</label>
                <Input
                  type="number"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  placeholder="8.5"
                  min="0"
                  max="10"
                  step="0.1"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">IMDb Rating</label>
                <Input
                  type="number"
                  value={form.imdbRating}
                  onChange={(e) => setForm({ ...form, imdbRating: e.target.value })}
                  placeholder="8.5"
                  min="0"
                  max="10"
                  step="0.1"
                />
              </div>
            </div>

            <Select
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-48"
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Poster URL</label>
              <Input
                value={form.poster}
                onChange={(e) => setForm({ ...form, poster: e.target.value })}
                placeholder="https://example.com/poster.jpg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Backdrop URL</label>
              <Input
                value={form.backdrop}
                onChange={(e) => setForm({ ...form, backdrop: e.target.value })}
                placeholder="https://example.com/backdrop.jpg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Trailer URL</label>
              <Input
                value={form.trailer}
                onChange={(e) => setForm({ ...form, trailer: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Genres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {genreList.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => setForm({ ...form, genreIds: toggleArrayItem(form.genreIds, genre.id) })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    form.genreIds.includes(genre.id)
                      ? "bg-white text-gray-950"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {countryList.map((country) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => setForm({ ...form, countryIds: toggleArrayItem(form.countryIds, country.id) })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    form.countryIds.includes(country.id)
                      ? "bg-white text-gray-950"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {country.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {languageList.map((language) => (
                <button
                  key={language.id}
                  type="button"
                  onClick={() => setForm({ ...form, languageIds: toggleArrayItem(form.languageIds, language.id) })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    form.languageIds.includes(language.id)
                      ? "bg-white text-gray-950"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {language.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Movie"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
