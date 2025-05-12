import { useState, useEffect } from "react";

export interface Post {
  id: string;
  title: string;
  body: string;
}

function useFetch(url: string) {
  const [data, setData] = useState<Post[]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((response) => response.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      });
  }, [url]);

  return { data, loading };
}

export default useFetch;
