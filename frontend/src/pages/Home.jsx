import CustomerReviews from "../components/CustomerReviews";
import FeaturedHotels from "../components/FeaturedHotels";
import Hero from "../components/Hero";
import PopularDestinations from "../components/PopularDestinations";

function Home() {
    return <div>
        <Hero />
        <PopularDestinations />
        <FeaturedHotels />
        <CustomerReviews/>
    </div>
}


export default Home;