(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  var revealables = document.querySelectorAll(".reveal");
  if (revealables.length) {
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealables.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      revealables.forEach(function (el) {
        el.classList.add("is-in");
      });
    }
  }

  var form = document.querySelector("[data-quote-form]");
  if (!form) {
    return;
  }

  var done = document.querySelector("[data-quote-done]");
  var doneName = document.querySelector("[data-done-name]");

  var validators = {
    name: function (value) {
      return value.trim().length >= 2 ? "" : "Please enter your name.";
    },
    email: function (value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
        ? ""
        : "Please enter a valid email address.";
    },
    phone: function (value) {
      var digits = value.replace(/[^0-9]/g, "");
      return digits.length >= 7 ? "" : "Please enter a valid phone number.";
    }
  };

  var check = function (input) {
    var wrap = input.closest(".field");
    var message = validators[input.name] ? validators[input.name](input.value) : "";
    wrap.classList.toggle("has-error", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    wrap.querySelector(".err").textContent = message;
    return !message;
  };

  form.querySelectorAll("input").forEach(function (input) {
    input.addEventListener("blur", function () {
      check(input);
    });
    input.addEventListener("input", function () {
      if (input.closest(".field").classList.contains("has-error")) {
        check(input);
      }
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var inputs = Array.prototype.slice.call(form.querySelectorAll("input"));
    var valid = inputs.map(check).every(Boolean);

    if (!valid) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) {
        firstBad.focus();
      }
      return;
    }

    var values = {};
    inputs.forEach(function (input) {
      values[input.name] = input.value.trim();
    });

    var subject = "Quote request: " + values.name;
    var body =
      "Name: " +
      values.name +
      "\nEmail: " +
      values.email +
      "\nPhone: " +
      values.phone;

    if (doneName) {
      doneName.textContent = values.name.split(" ")[0];
    }

    form.hidden = true;
    if (done) {
      done.classList.add("is-visible");
      done.setAttribute("tabindex", "-1");
      done.focus();
    }

    window.location.href =
      "mailto:info@myshipfront.com?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);
  });
})();
