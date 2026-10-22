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

  /* Apple Design: feedback on pointer-down, not click. Critically damped settle. */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Reduced motion swaps the scale for an opacity dip in CSS, so the class is always set. */
  function bindPress(selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener("pointerdown", function () {
        el.classList.add("is-pressed");
      });
      var clear = function () {
        el.classList.remove("is-pressed");
      };
      el.addEventListener("pointerup", clear);
      el.addEventListener("pointercancel", clear);
      el.addEventListener("pointerleave", clear);
    });
  }

  bindPress(".btn");
  bindPress(".nav-toggle");
  bindPress(".nav-links a");
  bindPress(".valuebar-item");
  bindPress(".chips li");
  bindPress(".footer-col a");
  bindPress(".contact-card a.big");
  bindPress(".inspo-card");
  bindPress(".split");
  bindPress(".contact-card");
  bindPress(".trust-card");
  bindPress(".step");

  var form = document.querySelector("[data-quote-form]");
  if (!form) {
    return;
  }

  var done = document.querySelector("[data-quote-done]");
  var card = form.closest(".form-card");
  var submitBtn = form.querySelector('button[type="submit"]');
  var status = form.querySelector("[data-quote-status]");
  var fail = form.querySelector("[data-quote-fail]");
  var failMailto = form.querySelector("[data-fail-mailto]");
  var honey = form.querySelector('input[name="_honey"]');
  var nextField = form.querySelector("[data-next]");
  var ENDPOINT = "https://formsubmit.co/ajax/info@myshipfront.com";
  var submitLabel = submitBtn ? submitBtn.textContent : "Submit";
  var sending = false;

  /* Without JS the form posts straight to Formsubmit. _next brings the visitor
     back here with ?sent=1 so the same thank-you state shows. */
  if (nextField) {
    nextField.value = window.location.href.split("#")[0].split("?")[0] + "?sent=1";
  }

  var fields = Array.prototype.slice.call(
    form.querySelectorAll(".field input, .field textarea")
  );

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
    },
    description: function (value) {
      return value.trim().length >= 2 ? "" : "Please add a short description.";
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

  fields.forEach(function (input) {
    input.addEventListener("blur", function () {
      check(input);
    });
    input.addEventListener("input", function () {
      if (input.closest(".field").classList.contains("has-error")) {
        check(input);
      }
    });
  });

  var showTray = function () {
    form.hidden = true;
    if (card) {
      card.classList.add("is-done");
    }
    if (done) {
      done.classList.add("is-visible");
      done.setAttribute("tabindex", "-1");
      done.focus();
    }
  };

  var resetButton = function () {
    sending = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
      submitBtn.classList.remove("is-morphing");
      submitBtn.textContent = submitLabel;
    }
  };

  var showFail = function (values) {
    resetButton();
    if (status) {
      status.textContent = "";
    }
    if (failMailto) {
      var body =
        "Name: " + values.name +
        "\nEmail: " + values.email +
        "\nPhone: " + values.phone +
        "\nDescription: " + values.description;
      failMailto.href =
        "mailto:info@myshipfront.com?subject=" +
        encodeURIComponent("Quote request: " + values.name) +
        "&body=" +
        encodeURIComponent(body);
    }
    if (fail) {
      fail.hidden = false;
      fail.focus();
    }
  };

  if (/[?&]sent=1\b/.test(window.location.search)) {
    showTray("");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (sending) {
      return;
    }
    if (fail) {
      fail.hidden = true;
    }

    var valid = fields.map(check).every(Boolean);
    if (!valid) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) {
        firstBad.focus();
      }
      return;
    }

    var values = {};
    fields.forEach(function (input) {
      values[input.name] = input.value.trim();
    });

    /* Bots fill the hidden field. Show success and send nothing. */
    if (honey && honey.value) {
      showTray(values.name);
      return;
    }

    sending = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
      if (!reduceMotion) {
        submitBtn.classList.add("is-morphing");
      }
      submitBtn.textContent = "Sending";
    }
    if (status) {
      status.textContent = "Sending your request.";
    }

    var payload = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      description: values.description,
      _replyto: values.email,
      _subject: "Quote request: " + values.name,
      _template: "table",
      _captcha: "false",
      _honey: ""
    };

    window
      .fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || String(data.success) !== "true") {
            throw new Error((data && data.message) || "Send failed");
          }
        });
      })
      .then(function () {
        if (status) {
          status.textContent = "";
        }
        resetButton();
        showTray(values.name);
      })
      .catch(function () {
        showFail(values);
      });
  });
})();
