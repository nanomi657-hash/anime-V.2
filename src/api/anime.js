// Base URL Official Sanka
const BASE_URL = "https://www.sankavollerei.web.id/anime";

const fetchData = async (path) => {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    // Sanka sering mengembalikan data dalam format:
    // { status: true, data: [...] } ATAU { animeList: [...] } ATAU langsung array [...]
    if (json && json.data) {
      return { data: json.data };
    } else if (json && json.animeList) {
      return { data: json.animeList };
    } else if (json && json.movies) {
      return { data: json.movies };
    }
    return { data: json || [] };
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return { data: [] };
  }
};

export const getHomeAnime = (provider = "animasu") => 
  fetchData(`/${provider}/home`);

// PERBAIKAN POPULAR: Dicoba tanpa/dengan page & query param
export const getPopularAnime = async (provider = "animasu", page = 1) => {
  let res = await fetchData(`/${provider}/popular/${page}`);
  if (!res.data || res.data.length === 0) {
    res = await fetchData(`/${provider}/popular?page=${page}`);
  }
  if (!res.data || res.data.length === 0) {
    res = await fetchData(`/${provider}/popular`);
  }
  return res;
};

// PERBAIKAN MOVIE: Mengakomodasi /movie dan /movies
export const getMoviesAnime = async (provider = "animasu", page = 1) => {
  let res = await fetchData(`/${provider}/movie/${page}`);
  if (!res.data || res.data.length === 0) {
    res = await fetchData(`/${provider}/movies/${page}`);
  }
  if (!res.data || res.data.length === 0) {
    res = await fetchData(`/${provider}/movie?page=${page}`);
  }
  if (!res.data || res.data.length === 0) {
    res = await fetchData(`/${provider}/movies`);
  }
  return res;
};

// PERBAIKAN ONGOING: Dicoba dengan variasi path pagination
export const getOngoingAnime = async (provider = "animasu", page = 1) => {
  let res = await fetchData(`/${provider}/ongoing/${page}`);
  if (!res.data || res.data.length === 0) {
    res = await fetchData(`/${provider}/ongoing?page=${page}`);
  }
  if (!res.data || res.data.length === 0) {
    res = await fetchData(`/${provider}/ongoing`);
  }
  return res;
};

export const getGenres = (provider = "animasu") => 
  fetchData(`/${provider}/genres`);

export const searchAnime = (query, provider = "animasu") => 
  fetchData(`/${provider}/search/${encodeURIComponent(query)}`);

export const getAnimeDetail = (slug, provider = "animasu") => {
  const cleanSlug = slug ? slug.replace(/^\/?(detail|anime|animasu|otakudesu)\//, "") : "";
  return fetchData(`/${provider}/detail/${cleanSlug}`);
};

export const getEpisodeDetail = (slug, provider = "animasu") => {
  const cleanSlug = slug ? slug.replace(/^\/?(episode|animasu|otakudesu)\//, "") : "";
  return fetchData(`/${provider}/episode/${cleanSlug}`);
};
