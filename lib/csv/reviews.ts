import Papa from "papaparse";

export type ReviewInsert = {
  review_text: string;
  rating: number | null;
  review_date: string | null;
  source: string | null;
  reviewer_name: string | null;
  sentiment: null;
  theme: null;
};

type CsvRow = Record<string, string | undefined>;

export type CsvValidationResult = {
  rows: ReviewInsert[];
  errors: string[];
  fatalError?: string;
};

const MAX_ROWS = 5_000;
const MAX_REVIEW_LENGTH = 10_000;

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function optionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function parseReviewCsv(csv: string): CsvValidationResult {
  if (!csv.trim()) {
    return { rows: [], errors: [], fatalError: "The CSV file is empty." };
  }

  const result = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim().toLowerCase(),
  });

  if (result.errors.length) {
    const first = result.errors[0];
    return {
      rows: [],
      errors: [],
      fatalError: `Malformed CSV near row ${(first.row ?? 0) + 1}: ${first.message}`,
    };
  }

  if (!result.meta.fields?.includes("review_text")) {
    return {
      rows: [],
      errors: [],
      fatalError: "The required “review_text” column is missing.",
    };
  }

  if (result.data.length > MAX_ROWS) {
    return {
      rows: [],
      errors: [],
      fatalError: `This MVP accepts up to ${MAX_ROWS.toLocaleString()} reviews per upload.`,
    };
  }

  const rows: ReviewInsert[] = [];
  const errors: string[] = [];

  result.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const reviewText = row.review_text?.trim() ?? "";
    if (!reviewText) {
      errors.push(`Row ${rowNumber}: review_text is empty.`);
      return;
    }
    if (reviewText.length > MAX_REVIEW_LENGTH) {
      errors.push(`Row ${rowNumber}: review_text exceeds ${MAX_REVIEW_LENGTH.toLocaleString()} characters.`);
      return;
    }

    let rating: number | null = null;
    if (row.rating?.trim()) {
      rating = Number(row.rating.trim());
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        errors.push(`Row ${rowNumber}: rating must be a whole number from 1 to 5.`);
        return;
      }
    }

    const reviewDate = optionalText(row.review_date);
    if (reviewDate && !isValidDate(reviewDate)) {
      errors.push(`Row ${rowNumber}: review_date must use YYYY-MM-DD.`);
      return;
    }

    rows.push({
      review_text: reviewText,
      rating,
      review_date: reviewDate,
      source: optionalText(row.source),
      reviewer_name: optionalText(row.reviewer_name),
      sentiment: null,
      theme: null,
    });
  });

  if (!rows.length) {
    return {
      rows,
      errors,
      fatalError: errors[0] ?? "No valid reviews were found.",
    };
  }

  return { rows, errors };
}
