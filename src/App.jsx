import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, loginWithGoogle, logoutUser, onAuthStateChanged } from "./firebase";
import {
  MoreVertical,
  Home,
  Search,
  Bookmark,
  History,
  Grid,
  PlayCircle,
  ArrowLeft,
  Loader2,
  ImageOff,
  Flame,
  Tv,
  Film,
  Info,
  X,
  MessageSquare,
  User,
  LogOut,
  Save,
  Camera
} from "lucide-react";
import {
  getHomeAnime,
  getPopularAnime,
  getMoviesAnime,
  getOngoingAnime,
  getGenres,
  searchAnime,
  getAnimeDetail,
  getEpisodeDetail,
} from "./api/anime";

// --- Helpers Rekursif ---
const findArrayInObject = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (typeof obj !== "object") return [];

  const priorityKeys = ["data", "result", "anime", "items", "list", "episodes", "episode_list", "genres", "popularAnime", "latestAnime"];
  for (const key of priorityKeys) {
    if (Array.isArray(obj[key]) && obj[key].length > 0) return obj[key];
  }

  for (const key in obj) {
    if (Array.isArray(obj[key]) && obj[key].length > 0) {
      return obj[key];
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      const found = findArrayInObject(obj[key]);
      if (found.length > 0) return found;
    }
  }
  return [];
};

const extractImage = (item) => {
  if (!item || typeof item !== "object") return "";
  const keys = ["thumbnail", "image", "thumb", "cover", "poster", "img", "src"];
  for (const key of keys) {
    if (item[key] && typeof item[key] === "string" && (item[key].startsWith("http") || item[key].startsWith("data:image"))) return item[key];
  }
  for (const key in item) {
    if (typeof item[key] === "object" && item[key] !== null) {
      const nested = extractImage(item[key]);
      if (nested) return nested;
    }
  }
  return "";
};

const extractStreamUrl = (obj) => {
  if (!obj) return "";
  if (typeof obj === "string" && (obj.startsWith("http") || obj.startsWith("//"))) return obj;
  const streamKeys = ["streamUrl", "stream_url", "stream_link", "stream", "iframe", "embed", "url", "link", "file"];
  for (const key of streamKeys) {
    if (obj[key] && typeof obj[key] === "string" && (obj[key].startsWith("http") || obj[key].startsWith("//"))) return obj[key];
  }
  if (Array.isArray(obj.servers) && obj.servers.length > 0) return extractStreamUrl(obj.servers[0]);
  if (Array.isArray(obj.stream) && obj.stream.length > 0) return extractStreamUrl(obj.stream[0]);
  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      const found = extractStreamUrl(obj[key]);
      if (found) return found;
    }
  }
  return "";
};

const extractString = (item, keys) => {
  if (!item) return "";
  for (const key of keys) {
    if (item[key] && typeof item[key] === "string") return item[key];
  }
  return "";
};

const extractSlug = (item) => {
  const raw = extractString(item, ["slug", "endpoint", "link", "url", "id", "genre_name"]);
  if (!raw) return "";
  return raw
    .replace(/^https?:\/\/[^\/]+/, "")
    .replace(/^\/anime\/animasu\/(detail|episode|genre)\//, "")
    .replace(/^\/|\/$/g, "");
};

// --- Component Animated Text LIQUID STREAM ---
const LiquidStreamTitle = () => {
  const text = "LIQUID STREAM";
  const [keyCount, setKeyCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setKeyCount((prev) => prev + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      key={keyCount}
      className="flex justify-center items-center overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
      }}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.8 },
            visible: { opacity: 1, y: 0, scale: 1 },
          }}
          className={`text-xl sm:text-2xl font-extrabold tracking-wider ${
            char === " " ? "mr-2" : "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
          }`}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
};

// --- WRAPPER UTAMA DENGAN AUTENTIKASI ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-white mb-3" />
        <p className="text-xs text-neutral-400">Memuat Liquid Stream...</p>
      </div>
    );
  }

  return user ? <MainApp user={user} /> : <LoginScreen />;
}

// --- TAMPILAN HALAMAN LOGIN ---
function LoginScreen() {
  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-white text-center">
      <img
        src="https://files.catbox.moe/zh57ll.jpg"
        alt="Logo Website"
        className="w-24 h-24 rounded-full mb-6 border border-neutral-800 shadow-xl object-cover"
      />
      <h1 className="text-3xl font-extrabold mb-2 tracking-tight">LIQUID STREAM</h1>
      <p className="text-neutral-400 text-sm mb-8 max-w-xs">
        Silakan login terlebih dahulu untuk mengakses ribuan koleksi anime.
      </p>
      <button
        onClick={loginWithGoogle}
        className="px-8 py-3.5 bg-white text-black font-bold text-sm rounded-full hover:bg-neutral-200 transition-all active:scale-95 shadow-lg cursor-pointer"
      >
        Login dengan Google
      </button>
    </div>
  );
}

// --- TAMPILAN UTAMA APLIKASI ANIME ---
function MainApp({ user }) {
  const [activeTab, setActiveTab] = useState("home");
  const [categoryMenu, setCategoryMenu] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Logo Website Permanen
  const LOGO_WEB = "https://files.catbox.moe/zh57ll.jpg";

  // Profil User khusus (Tersimpan terpisah)
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("user_profile");
    return saved ? JSON.parse(saved) : {
      name: user?.displayName || "User",
      bio: "Anime Streamer",
      photo: user?.photoURL || LOGO_WEB
    };
  });

  const [animeList, setAnimeList] = useState([]);
  const [heroAnimeList, setHeroAnimeList] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

  const [genresList, setGenresList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedAnime, setSavedAnime] = useState(() => JSON.parse(localStorage.getItem("savedAnime") || "[]"));
  const [historyAnime, setHistoryAnime] = useState(() => JSON.parse(localStorage.getItem("historyAnime") || "[]"));

  const [loading, setLoading] = useState(false);
  const [activeDetail, setActiveDetail] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);

  useEffect(() => localStorage.setItem("user_profile", JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem("savedAnime", JSON.stringify(savedAnime)), [savedAnime]);
  useEffect(() => localStorage.setItem("historyAnime", JSON.stringify(historyAnime)), [historyAnime]);

  useEffect(() => {
    getPopularAnime(1).then((res) => {
      const list = findArrayInObject(res.data);
      setHeroAnimeList(list.slice(0, 5));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (heroAnimeList.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroAnimeList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroAnimeList]);

  useEffect(() => {
    if (activeDetail || activeEpisode) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        let res;
        if (categoryMenu) {
          switch (categoryMenu) {
            case "popular": res = await getPopularAnime(); break;
            case "ongoing": res = await getOngoingAnime(); break;
            case "movies": res = await getMoviesAnime(); break;
            default: break;
          }
        } else if (activeTab === "home") {
          res = await getHomeAnime();
        } else if (activeTab === "genre" && !selectedGenre) {
          res = await getGenres();
          setGenresList(findArrayInObject(res.data));
          setLoading(false);
          return;
        }

        if (res) {
          setAnimeList(findArrayInObject(res.data));
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, categoryMenu, activeDetail, activeEpisode, selectedGenre]);

  const handleSelectGenre = async (genreItem) => {
    const slug = extractSlug(genreItem);
    const genreName = extractString(genreItem, ["name", "title", "genre", "genre_name"]) || slug;
    
    setSelectedGenre(genreName);
    setLoading(true);
    try {
      const res = await searchAnime(genreName);
      setAnimeList(findArrayInObject(res.data));
    } catch (err) {
      console.error("Genre Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setActiveDetail(null);
    setActiveEpisode(null);
    try {
      const res = await searchAnime(searchQuery);
      setAnimeList(findArrayInObject(res.data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnime = async (item) => {
    const slug = extractSlug(item);
    if (!slug) return;

    setLoading(true);
    try {
      const res = await getAnimeDetail(slug);
      setActiveDetail(res.data?.data || res.data);
      setHistoryAnime((prev) => [item, ...prev.filter((i) => extractSlug(i) !== slug)]);
    } catch (err) {
      console.error("Detail Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEpisode = async (ep) => {
    const slug = extractSlug(ep);
    if (!slug) return;

    setLoading(true);
    try {
      const res = await getEpisodeDetail(slug);
      setActiveEpisode(res.data?.data || res.data);
    } catch (err) {
      console.error("Episode Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveAnime = (anime) => {
    const slug = extractSlug(anime);
    const exists = savedAnime.some((item) => extractSlug(item) === slug);
    if (exists) {
      setSavedAnime((prev) => prev.filter((item) => extractSlug(item) !== slug));
    } else {
      setSavedAnime((prev) => [...prev, anime]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 relative overflow-x-hidden">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-black/80 border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        
        {/* Logo Website Tetap Menggunakan LOGO_WEB Permanen */}
        <div 
          onClick={() => { setActiveDetail(null); setActiveEpisode(null); setActiveTab("home"); setCategoryMenu(""); setSelectedGenre(null); }}
          className="flex items-center gap-3 cursor-pointer mx-auto"
        >
          <img 
            src={LOGO_WEB} 
            alt="Website Logo" 
            className="w-9 h-9 rounded-full object-cover border border-neutral-700"
          />
          <LiquidStreamTitle />
        </div>
        
        {/* Menu Titik Tiga Top Right */}
        <div className="relative absolute right-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-neutral-800 transition-colors text-white cursor-pointer"
          >
            <MoreVertical className="w-6 h-6" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 backdrop-blur-xl rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1"
              >
                <button
                  onClick={() => {
                    setIsProfileOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white hover:bg-neutral-800 transition-all border-b border-neutral-800/80 mb-1 cursor-pointer"
                >
                  <User className="w-4 h-4 text-white" />
                  <span>Profil Saya</span>
                </button>

                {[
                  { id: "popular", label: "Popular", icon: Flame },
                  { id: "ongoing", label: "Ongoing", icon: Tv },
                  { id: "movies", label: "Movie", icon: Film },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCategoryMenu(item.id);
                        setSelectedGenre(null);
                        setActiveDetail(null);
                        setActiveEpisode(null);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                        categoryMenu === item.id
                          ? "bg-white text-black font-semibold"
                          : "hover:bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setIsInfoModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:bg-neutral-800 transition-all border-t border-neutral-800 mt-1 cursor-pointer"
                >
                  <Info className="w-4 h-4" />
                  <span>Info</span>
                </button>

                <button
                  onClick={() => logoutUser()}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all border-t border-neutral-800 mt-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl max-w-sm w-full relative shadow-2xl text-center space-y-4"
            >
              <button
                onClick={() => setIsProfileOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-white text-left">Edit Profil User</h3>

              {/* Upload Foto Profil User dari Galeri */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-700">
                  <img
                    src={profile.photo}
                    alt="User Profile"
                    className="w-full h-full object-cover"
                  />
                  <label htmlFor="photo-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </label>
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="photo-upload" className="text-xs text-neutral-400 cursor-pointer hover:text-white underline">
                  Ganti Foto Profil dari Galeri
                </label>
              </div>

              <div className="space-y-3 text-left">
                <div>
                  <label className="text-xs text-neutral-400">Nama</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-white mt-1 h-20 resize-none"
                  />
                </div>
              </div>

              <button
                onClick={() => setIsProfileOpen(false)}
                className="w-full py-2.5 bg-white text-black font-bold rounded-lg text-xs hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {isInfoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl max-w-sm w-full relative shadow-2xl backdrop-blur-xl text-center space-y-4"
            >
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border border-neutral-700 shadow-lg">
                <img 
                  src={LOGO_WEB} 
                  alt="Developer Logo" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold">Developer</p>
                <h3 className="text-xl font-bold text-white">Xynn</h3>
              </div>

              <a
                href="https://whatsapp.com/channel/0029Vb8yMdiIt5rnDLcmnX1z"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-full text-xs font-medium hover:bg-neutral-700 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Channel WhatsApp</span>
              </a>

              <p className="text-xs text-neutral-400 leading-relaxed px-2">
                Website ini dibuat menggunakan bahasa pemrograman <strong>React.js</strong> dan <strong>Tailwind</strong> dan juga menggunakan API dari <strong>Sanka Vollerei</strong>.
              </p>

              <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-500 font-medium">
                © LIQUID STREAM 2026
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Carousel */}
      {!activeDetail && !activeEpisode && heroAnimeList.length > 0 && activeTab === "home" && !categoryMenu && !selectedGenre && (
        <section className="max-w-7xl mx-auto px-6 pt-6">
          <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden border border-neutral-800 group">
            <AnimatePresence mode="wait">
              {heroAnimeList[heroIndex] && (
                <motion.div
                  key={heroIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => handleSelectAnime(heroAnimeList[heroIndex])}
                >
                  <img
                    src={extractImage(heroAnimeList[heroIndex])}
                    alt="Hero Poster"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 space-y-2">
                    <span className="px-3 py-1 bg-white text-black font-bold rounded-full text-xs inline-block">
                      Featured Series
                    </span>
                    <h2 className="text-xl sm:text-3xl font-bold text-white line-clamp-1">
                      {extractString(heroAnimeList[heroIndex], ["title", "name"])}
                    </h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-4 right-6 flex gap-2 z-10">
              {heroAnimeList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === heroIndex ? "w-6 bg-white" : "w-2 bg-neutral-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
            <p className="mt-4 text-sm text-neutral-400">Memuat konten...</p>
          </div>
        ) : activeEpisode ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <button
              onClick={() => setActiveEpisode(null)}
              className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Detail
            </button>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h1 className="text-xl font-semibold mb-4">
                {extractString(activeEpisode, ["title", "name"]) || "Streaming Episode"}
              </h1>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-800">
                {extractStreamUrl(activeEpisode) ? (
                  <iframe
                    src={extractStreamUrl(activeEpisode)}
                    className="w-full h-full"
                    allowFullScreen
                    title="Video Player"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-6">
                    <PlayCircle className="w-12 h-12 mb-2 text-neutral-600" />
                    <p className="text-sm font-medium">Stream player tidak ditemukan dari server.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : activeDetail ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveDetail(null)}
                className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>

              <button
                onClick={() => toggleSaveAnime(activeDetail)}
                className={`p-2.5 rounded-full border border-neutral-800 transition-all cursor-pointer ${
                  savedAnime.some((i) => extractSlug(i) === extractSlug(activeDetail))
                    ? "bg-white text-black"
                    : "bg-neutral-900 text-neutral-300 hover:text-white"
                }`}
              >
                <Bookmark className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
              <div className="space-y-4">
                {extractImage(activeDetail) ? (
                  <img
                    src={extractImage(activeDetail)}
                    alt="Poster"
                    className="w-full rounded-xl object-cover border border-neutral-800 shadow-2xl"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-neutral-800 rounded-xl border border-neutral-800 flex flex-col items-center justify-center text-neutral-500">
                    <ImageOff className="w-10 h-10 mb-2" />
                    <span className="text-xs">No Poster</span>
                  </div>
                )}
              </div>
              <div className="md:col-span-2 space-y-4">
                <h1 className="text-3xl font-bold text-white">
                  {extractString(activeDetail, ["title", "name"])}
                </h1>
                <p className="text-neutral-300 text-sm leading-relaxed">
                  {extractString(activeDetail, ["synopsis", "desc", "description"]) || "Tidak ada sinopsis."}
                </p>

                <h3 className="text-lg font-semibold pt-4 border-t border-neutral-800">Daftar Episode</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2">
                  {findArrayInObject(activeDetail).map((ep, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectEpisode(ep)}
                      className="p-2.5 text-xs text-left bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-all truncate flex items-center gap-2 text-neutral-200 cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-white flex-shrink-0" />
                      <span className="truncate">
                        {extractString(ep, ["title", "name", "episode"]) || `Episode ${idx + 1}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {activeTab === "search" && (
              <form onSubmit={handleSearch} className="relative max-w-md mx-auto mb-8">
                <input
                  type="text"
                  placeholder="Cari anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-neutral-500 text-white placeholder-neutral-500"
                />
                <Search className="absolute left-4 top-3 text-neutral-500 w-4 h-4" />
              </form>
            )}

            {activeTab === "genre" && !selectedGenre && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                {genresList.map((g, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectGenre(g)}
                    className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-white transition-all text-center cursor-pointer font-medium text-sm text-neutral-200 hover:scale-105"
                  >
                    {extractString(g, ["name", "title", "genre", "genre_name"]) || "Genre"}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "genre" && selectedGenre && (
              <div className="mb-6 flex items-center gap-3">
                <button
                  onClick={() => setSelectedGenre(null)}
                  className="p-2 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-semibold text-white">Genre: {selectedGenre}</h2>
              </div>
            )}

            {activeTab === "save" && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 text-white">Anime Disimpan</h2>
                {savedAnime.length === 0 && <p className="text-sm text-neutral-500">Belum ada anime yang disimpan.</p>}
              </div>
            )}

            {activeTab === "history" && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 text-white">Riwayat Tontonan</h2>
                {historyAnime.length === 0 && <p className="text-sm text-neutral-500">Belum ada riwayat tontonan.</p>}
              </div>
            )}

            {(activeTab !== "genre" || selectedGenre) && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
              >
                {(activeTab === "save" ? savedAnime : activeTab === "history" ? historyAnime : animeList).map((item, index) => {
                  const imageSrc = extractImage(item);
                  const titleText = extractString(item, ["title", "name"]) || "Untitled";
                  const subText = extractString(item, ["episode", "status", "type"]);

                  return (
                    <motion.div
                      key={index}
                      whileHover={{ y: -8, scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleSelectAnime(item)}
                      className="cursor-pointer group relative bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col justify-between"
                    >
                      <div className="aspect-[3/4] overflow-hidden relative bg-neutral-800 flex items-center justify-center">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={titleText}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <ImageOff className="w-8 h-8 text-neutral-600" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 pointer-events-none" />
                      </div>
                      <div className="p-4 relative z-10">
                        <h2 className="font-semibold text-sm line-clamp-2 text-neutral-200 group-hover:text-white transition-colors">
                          {titleText}
                        </h2>
                        {subText && <p className="text-xs text-neutral-500 mt-1">{subText}</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-black/80 border-t border-neutral-800 px-4 py-2 flex justify-around items-center max-w-md mx-auto sm:rounded-t-2xl">
        {[
          { id: "home", label: "Home", icon: Home },
          { id: "search", label: "Search", icon: Search },
          { id: "save", label: "Save", icon: Bookmark },
          { id: "history", label: "History", icon: History },
          { id: "genre", label: "Genre", icon: Grid },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !categoryMenu && !activeDetail && !activeEpisode;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCategoryMenu("");
                setSelectedGenre(null);
                setActiveDetail(null);
                setActiveEpisode(null);
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer ${
                isActive ? "text-white scale-110" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
