(function ($) {
    "use strict";
    
    // Dropdown on mouse hover
    $(document).ready(function () {
        function toggleNavbarMethod() {
            if ($(window).width() > 992) {
                $('.navbar .dropdown').on('mouseover', function () {
                    $('.dropdown-toggle', this).trigger('click');
                }).on('mouseout', function () {
                    $('.dropdown-toggle', this).trigger('click').blur();
                });
            } else {
                $('.navbar .dropdown').off('mouseover').off('mouseout');
            }
        }
        toggleNavbarMethod();
        $(window).resize(toggleNavbarMethod);
    });


    // Date and time picker
    $('.date').datetimepicker({
        format: 'L'
    });
    $('.time').datetimepicker({
        format: 'LT'
    });
    
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Portfolio isotope and filter
    var portfolioIsotope = $('.portfolio-container').isotope({
        itemSelector: '.portfolio-item',
        layoutMode: 'fitRows'
    });
    $('#portfolio-flters li').on('click', function () {
        $("#portfolio-flters li").removeClass('active');
        $(this).addClass('active');

        portfolioIsotope.isotope({filter: $(this).data('filter')});
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        items: 1,
        dots: false,
        loop: true,
    });
    
})(jQuery);

var li_links = document.querySelectorAll(".links ul li");
var view_wraps = document.querySelectorAll(".view_wrap");
var list_view = document.querySelector(".list-view");
var grid_view = document.querySelector(".grid-view");

li_links.forEach(function(link){
	link.addEventListener("click", function(){
		li_links.forEach(function(link){
			link.classList.remove("active");
		})

		link.classList.add("active");

		var li_view = link.getAttribute("data-view");

		view_wraps.forEach(function(view){
			view.style.display = "none";
		})

		if(li_view == "list-view"){
			list_view.style.display = "block";
		}
		else{
			grid_view.style.display = "block";
		}
	})
})

document.querySelector('.btn-grid').addEventListener('click', function() {
    document.querySelector('.list-view').style.display = 'none';
    document.querySelector('.grid-view').style.display = 'block';
    this.style.display = 'none'; // Add this line
});

