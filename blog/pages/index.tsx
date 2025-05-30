import { useSession } from "next-auth/react";
import Link from "next/link";
import useFetch from "hooks/useFetch";
import type { Blog } from "api/models/Blog";
import BlogCard from "components/shared/BlogCard";
import Header from "components/Header";
import Footer from "components/Footer";
import { useRouter } from "next/router";
import Slider from "react-slick";
import { useEffect, useState } from "react";
import Head from "next/head";
import { useBlogActions } from "hooks/useBlogActions";

// Need to import slick styles
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Custom arrow components for carousel
function NextArrow(props: any) {
  const { className, style, onClick } = props;
  return (
    <div
      className={`${className} z-20 right-5 rounded-full bg-white w-12 h-12 flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-green-50`}
      style={{ ...style, display: "flex" }}
      onClick={onClick}
    >
      <span className="text-green-600 text-2xl font-bold">&rsaquo;</span>
    </div>
  );
}

function PrevArrow(props: any) {
  const { className, style, onClick } = props;
  return (
    <div
      className={`${className} z-20 left-5 rounded-full bg-white w-12 h-12 flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-green-50`}
      style={{ ...style, display: "flex" }}
      onClick={onClick}
    >
      <span className="text-green-600 text-2xl font-bold">&lsaquo;</span>
    </div>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const { data: blogs = [], loading, error, mutate } = useFetch<Blog[]>("/api/blogs");
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { handleLike, handleDelete } = useBlogActions({ onUpdate: mutate });
  
  useEffect(() => {
    // Log authentication status when it changes
    console.log('Home page session status:', status, session?.user?.email);
    
    // Add additional class to body when authenticated via Google
    if (session?.user?.provider === 'google') {
      document.body.classList.add('google-authenticated');
    }
  }, [session, status]);

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      // Initial check
      checkIfMobile();
      
      // Add event listener for window resize
      window.addEventListener('resize', checkIfMobile);
      
      // Cleanup
      return () => window.removeEventListener('resize', checkIfMobile);
    }
  }, []);

  // Enhanced carousel settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 6000,
    pauseOnHover: true,
    arrows: !isMobile,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    cssEase: "cubic-bezier(0.4, 0, 0.2, 1)",
    fade: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          arrows: false,
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: true
        }
      }
    ]
  };
  const handleEdit = (blogId: string) => {
    router.push(`/blogs/edit/${blogId}`);
  };

  const handleBlogDelete = async (blogId: string) => {
    const result = await handleDelete(blogId);
    if (result?.success) {
      mutate(); // Refresh the blogs list
    }
  };

  // Featured blogs for the carousel - use the 5 most recent
  const carouselBlogs = blogs?.slice(0, 5) || [];
  
  // Regular featured blogs for the grid section
  const featuredBlogs = blogs?.slice(0, 3) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Blog Platform</title>
        <meta name="description" content="Explore our collection of interesting blogs" />
      </Head>
      
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-green-600 text-white w-full hero-section max-w-full">
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img 
              src="/uploads/1747172898787.jpg" 
              alt="Hero background" 
              className="w-full h-full object-cover object-center" 
            />
            <div className="absolute inset-0 bg-green-600/70"></div>
          </div>
          <div className="max-w-screen-2xl mx-auto px-4 relative z-10 py-24">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Mirë se vini në Blog
            </h1>
            <p className="text-xl mb-8">
              {session?.user?.isSuperUser 
                ? "Lexoni, krijoni dhe menaxhoni blogjet tuaja."
                : "Lexoni dhe zbuloni përmbajtje interesante."}
            </p>
            {!session && (
              <Link
                href="/auth/signin"
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                Bashkohu Tani
              </Link>
            )}
          </div>
        </div>

        {/* Blog Carousel Section */}
        {!loading && !error && carouselBlogs.length > 0 && (
          <div className="py-12 bg-gray-50 w-full">
            <div className="max-w-screen-2xl mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8 text-center text-black">Postimet e Spikatura</h2>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
                  Gabim gjatë ngarkimit të blogeve: {error}
                </div>
              )}
              
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="w-full mx-auto carousel-container">
                  <Slider {...sliderSettings}>
                    {carouselBlogs.map((blog) => (
                      <div key={blog._id} className="px-4">
                        <div className="carousel-card bg-white rounded-lg shadow-lg overflow-hidden h-full transition-all duration-300 hover:shadow-xl">
                          {blog.image && (
                            <div className="relative w-full h-100">
                              <img
                                src={blog.image}
                                alt={blog.title}
                                className="object-cover w-full h-full"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                              <div className="absolute bottom-4 right-4 flex space-x-3">
                                <span className="bg-white/80 text-black px-3 py-1 rounded-full text-sm flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                                  </svg>
                                  {blog.likes?.length || 0}
                                </span>
                                {blog.comments && blog.comments.length > 0 && (
                                  <span className="bg-white/80 text-black px-3 py-1 rounded-full text-sm flex items-center">
                                    <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"></path>
                                    </svg>
                                    {blog.comments.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="p-6">
                            <h3 className="text-2xl font-bold text-black mb-3">{blog.title}</h3>
                            <p className="text-black line-clamp-3 mb-4">{blog.content}</p>
                            <div className="flex justify-between items-center">
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-600">
                                  {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('sq-AL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  }) : ''}
                                </span>
                              </div>
                              <Link
                                href={`/blogs/${blog._id}`}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                              >
                                Lexo më shumë
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Featured Blogs Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Bloget e Fundit</h2>
            <Link
              href="/blogs"
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              Shiko të gjitha →
            </Link>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Gabim gjatë ngarkimit të blogeve: {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBlogs.map((blog: Blog) => (                <BlogCard
                  key={blog._id}
                  blog={blog}
                  onLike={handleLike}
                  onEdit={session?.user?.id === blog.author || session?.user?.isSuperUser ? handleEdit : undefined}
                  onDelete={session?.user?.id === blog.author || session?.user?.isSuperUser ? handleBlogDelete : undefined}
                />
              ))}
            </div>
          )}

          {!loading && featuredBlogs.length === 0 && (
            <p className="text-center text-gray-600">Nuk ka poste për të shfaqur.</p>
          )}
        </div>

        {/* Call to Action Section */}
        <div className="bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {!session?.user ? "Dëshironi të merrni pjesë?" :
               session.user.isSuperUser ? "Dëshironi të krijoni një blog?" :
               "Shikoni dhe pëlqeni blogjet tona"}
            </h2>
            <p className="text-gray-600 mb-8">
              {!session?.user
                ? "Regjistrohuni për të ndarë mendimet tuaja dhe për të pëlqyer postimet."
                : session.user.isSuperUser
                ? "Ndani mendimet tuaja me komunitetin tonë."
                : "Lexoni, komentoni dhe pëlqeni postimet e blogut."}
            </p>
            <Link
              href={!session?.user ? "/sign-up" : 
                    session.user.isSuperUser ? "/blogs/create" : "/blogs"}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              {session?.user?.isSuperUser 
                ? (session?.user?.name ? "Krijo Blog" : "Regjistrohu")
                : (session?.user?.name ? "Shiko Blog" : "Regjistrohu")
              }
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
