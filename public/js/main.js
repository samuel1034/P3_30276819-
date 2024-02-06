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
});

// Working Shopping List 
const buyButtons = document.querySelectorAll('.buy-button');
const shoppingList = document.querySelector('.shopping-list');
const cartItems = shoppingList.querySelector('.cart-items');
const quantityDisplay = document.querySelector('.cantidad');
const totalPriceElement = document.querySelector('.total-price');

let productCount = 0;
let totalPrice = 0;

buyButtons.forEach(button => {
    button.addEventListener('click', () => {
        const product = button.parentElement.parentElement;
        const productName = product.querySelector('.hiddenProductName').value;
        const productDescription = parseFloat(product.querySelector('.hiddenProductDescription').value);
        const productImage = product.querySelector('.product-image').getAttribute('src');

        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        cartItem.innerHTML = `
            <img src="${productImage}" alt="${productName}">
            <div>
                <h4>${productName}</h4>
                <p>${productDescription} $</p>
            </div>
            <button class="remove-button">Eliminar</button>
        `;

        // Store product price in cart item
        cartItem.dataset.price = productDescription;

        cartItems.appendChild(cartItem);

        // Add product price to total price
        totalPrice += productDescription;

        // Update total price element
        totalPriceElement.textContent = 'Total: $' + totalPrice.toFixed(2);

        productCount++;

        quantityDisplay.textContent = 'Cantidad: ' + productCount;

        const removeButton = cartItem.querySelector('.remove-button');
        removeButton.addEventListener('click', () => {
            // Get product price from cart item
            const productPrice = parseFloat(cartItem.dataset.price);

            // Subtract product price from total price
            totalPrice -= productPrice;

            // Update total price element
            totalPriceElement.textContent = 'Total: $' + totalPrice.toFixed(2);

            // Decrease product count
            productCount--;

            // Update quantity display
            quantityDisplay.textContent = 'Cantidad: ' + productCount;

            cartItem.remove();
        });
    });
});

const checkoutButton = document.querySelector('.btn-block');

checkoutButton.addEventListener('click', () => {
    // Redirect to payment.ejs with the total price as a query parameter
    window.location.href = `/payments?totalPrice=${totalPrice}&productCount=${productCount}`;
});

fetch('/payments', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        totalPrice: document.querySelector('.total-price').textContent.split(': ')[1],
        cantidad: document.getElementById('cantidad').textContent.split(': ')[1],       
    }),    
})
.then(response => response.json())
.then(data => console.log(data))
.catch((error) => {
  console.error('Error:', error);
});

$(function () {
    $("#rateYo").rateYo({
      rating: 3.6,
      numStars: 5,
      precision: 2,
      minValue: 1,
      maxValue: 5,
      onSet: function (rating, rateYoInstance) {
        $(this).next().text('Rating: ' + rating);
      },
      onHover: function (rating, rateYoInstance) {
        if (rating) {
          $(this).next().text('Hover rating: ' + rating);
        } else {
          $(this).next().text('Rating: ' + this.getAttribute('data-rateyo-rating'));
        }
      }
    });
  });