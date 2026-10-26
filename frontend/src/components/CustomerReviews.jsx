import "./CustomerReviews.css";
import { useEffect, useRef, useState } from "react";
import api from "../api/api";

function CustomerReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const sliderRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    useEffect(() => {
        let active = true;
        api.get("/reviews")
            .then(({ data }) => {
                if (active) setReviews(Array.isArray(data?.data) ? data.data : []);
            })
            .catch(() => {
                if (active) setReviews([]);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        const syncSliderState = () => {
            const slider = sliderRef.current;
            if (!slider) return;
            const cards = Array.from(slider.querySelectorAll("[data-review-slide]"));
            const sliderLeft = slider.getBoundingClientRect().left;
            const nearest = cards.reduce((current, card, index) => {
                const distance = Math.abs(card.getBoundingClientRect().left - sliderLeft);
                return distance < current.distance ? { index, distance } : current;
            }, { index: 0, distance: Number.POSITIVE_INFINITY });
            setActiveIndex(nearest.index);
            setCanScrollPrev(slider.scrollLeft > 2);
            setCanScrollNext(slider.scrollLeft + slider.clientWidth < slider.scrollWidth - 2);
        };
        const frame = requestAnimationFrame(syncSliderState);
        window.addEventListener("resize", syncSliderState);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("resize", syncSliderState);
        };
    }, [loading, reviews]);

    function updateSliderState() {
        const slider = sliderRef.current;
        if (!slider) return;
        const cards = Array.from(slider.querySelectorAll("[data-review-slide]"));
        const sliderLeft = slider.getBoundingClientRect().left;
        const nearest = cards.reduce((current, card, index) => {
            const distance = Math.abs(card.getBoundingClientRect().left - sliderLeft);
            return distance < current.distance ? { index, distance } : current;
        }, { index: 0, distance: Number.POSITIVE_INFINITY });
        setActiveIndex(nearest.index);
        setCanScrollPrev(slider.scrollLeft > 2);
        setCanScrollNext(slider.scrollLeft + slider.clientWidth < slider.scrollWidth - 2);
    }

    function moveSlider(direction) {
        const slider = sliderRef.current;
        if (slider) slider.scrollBy({ left: direction * slider.clientWidth * 0.9, behavior: "smooth" });
    }

    function goToReview(index) {
        const slide = sliderRef.current?.querySelectorAll("[data-review-slide]")?.[index];
        slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    }

    return (
        <section id="reviews">
            <h1>Guest reviews</h1>
            <p>Real feedback from guests who completed a stay with us</p>
            <div id="reviews-container-grid" ref={sliderRef} tabIndex={reviews.length > 0 ? 0 : undefined} aria-label="Guest review carousel" onScroll={updateSliderState} onKeyDown={(event) => {
                if (event.key === "ArrowRight") moveSlider(1);
                if (event.key === "ArrowLeft") moveSlider(-1);
            }}>
                {loading ? <p className="reviews-empty">Loading guest reviews…</p>
                    : reviews.length ? reviews.map((review, index) => <article id="review-card" data-review-slide key={review._id} role="group" aria-label={`Review ${index + 1} of ${reviews.length}`}>
                        <div className="review-card-heading">
                            <div className="review-avatar" aria-hidden="true">{String(review.guestName || "G").slice(0, 1).toUpperCase()}</div>
                            <div className="review-guest-details">
                                <h3>{review.guestName}</h3>
                                <p>{[review.hotelName, review.city].filter(Boolean).join(" · ")}</p>
                            </div>
                        </div>
                        <div className="review-stars" role="img" aria-label={`${review.rating} out of 5 stars`}>
                            {Array.from({ length: 5 }, (_, index) => <span key={index} className={index < review.rating ? "is-filled" : ""}>★</span>)}
                        </div>
                        <p className="review-comment">{review.comment}</p>
                        <small className="review-verified">Verified guest stay</small>
                    </article>)
                    : <p className="reviews-empty">No guest reviews yet. Completed guests can share the first one from My Bookings.</p>}
            </div>
            {!loading && reviews.length > 1 && <div className="reviews-slider-controls">
                <div className="reviews-slider-dots" aria-label="Choose a review">
                    {reviews.map((review, index) => <button key={review._id} type="button" className={index === activeIndex ? "is-active" : ""} aria-label={`Go to review ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} onClick={() => goToReview(index)} />)}
                </div>
                <div className="reviews-slider-arrows">
                    <button type="button" onClick={() => moveSlider(-1)} disabled={!canScrollPrev} aria-label="Previous reviews">←</button>
                    <button type="button" onClick={() => moveSlider(1)} disabled={!canScrollNext} aria-label="Next reviews">→</button>
                </div>
            </div>}
        </section>
    )
}

export default CustomerReviews;
