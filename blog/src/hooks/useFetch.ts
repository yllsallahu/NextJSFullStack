import { useState, useEffect } from "react";

interface FetchResponse<T> {
  data?: T[];
  loading: boolean;
  error: string | null;
  post: (data: any) => Promise<any>;
}

function useFetch<T>(url: string): FetchResponse<T> {
  const [data, setData] = useState<T[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const post = async (data: any) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return result;
    } catch (err) {
      if (err instanceof Error) {
        return { error: err.message };
      }
      return { error: 'Unknown error occurred' };
    }
  };

  useEffect(() => {
    fetch(url)
      .then((response) => response.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error, post };
}

export default useFetch;
