document.addEventListener("DOMContentLoaded", () => {
  // Handle Supabase auth callback in URL hash
  if (window.location.hash && window.location.hash.includes("access_token")) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");
    
    // Redirect to backend endpoint with tokens as query params
    if (accessToken) {
      let url = `/auth_callback?access_token=${encodeURIComponent(accessToken)}`;
      if (refreshToken) url += `&refresh_token=${encodeURIComponent(refreshToken)}`;
      if (type) url += `&type=${encodeURIComponent(type)}`;
      window.location.href = url;
    }
  }

  // Toggle password visibility
  const togglePasswordButtons = document.querySelectorAll(".toggle-password")
  togglePasswordButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input")
      const icon = this.querySelector("i")

      if (input.type === "password") {
        input.type = "text"
        icon.classList.remove("fa-eye")
        icon.classList.add("fa-eye-slash")
      } else {
        input.type = "password"
        icon.classList.remove("fa-eye-slash")
        icon.classList.add("fa-eye")
      }
    })
  })

  // Password strength meter
  const passwordInput = document.getElementById("password") || document.getElementById("new_password")
  const strengthMeter = document.querySelector(".strength-meter-fill")
  const strengthText = document.querySelector(".strength-text span")

  if (passwordInput && strengthMeter && strengthText) {
    passwordInput.addEventListener("input", function () {
      const password = this.value
      const strength = calculatePasswordStrength(password)

      strengthMeter.setAttribute("data-strength", strength)

      // Update strength text and color
      const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"]
      const strengthColors = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#16a34a"]

      strengthText.textContent = strengthLabels[strength]
      strengthMeter.style.backgroundColor = strengthColors[strength]
    })
  }

  // Enhanced form validation
  const loginForm = document.getElementById("login-form")
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      const email = document.getElementById("email").value.trim()
      const password = document.getElementById("password").value

      // Clear previous error styling
      clearErrorStyling()

      let hasErrors = false

      if (!email) {
        showFieldError("email", "Email is required")
        hasErrors = true
      } else if (!isValidEmail(email)) {
        showFieldError("email", "Please enter a valid email address")
        hasErrors = true
      }

      if (!password) {
        showFieldError("password", "Password is required")
        hasErrors = true
      }

      if (hasErrors) {
        e.preventDefault()
      }
    })
  }

  // Signup form validation
  const signupForm = document.getElementById("signup-form")
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      const fullname = document.getElementById("fullname").value.trim()
      const email = document.getElementById("email").value.trim()
      const password = document.getElementById("password").value
      const confirmPassword = document.getElementById("confirm-password").value
      const termsAccepted = document.getElementById("terms").checked
      const displayName = document.getElementById("display_name").value.trim()
      const phone = document.getElementById("phone").value.trim()

      // Clear previous error styling
      clearErrorStyling()

      let hasErrors = false

      if (!fullname) {
        showFieldError("fullname", "Full name is required")
        hasErrors = true
      }

      if (!email) {
        showFieldError("email", "Email is required")
        hasErrors = true
      } else if (!isValidEmail(email)) {
        showFieldError("email", "Please enter a valid email address")
        hasErrors = true
      }

      if (!password) {
        showFieldError("password", "Password is required")
        hasErrors = true
      } else if (password.length < 8) {
        showFieldError("password", "Password must be at least 8 characters long")
        hasErrors = true
      }

      if (!confirmPassword) {
        showFieldError("confirm-password", "Please confirm your password")
        hasErrors = true
      } else if (password !== confirmPassword) {
        showFieldError("confirm-password", "Passwords do not match")
        hasErrors = true
      }

      if (!termsAccepted) {
        showFieldError("terms", "You must agree to the Terms of Service")
        hasErrors = true
      }

      if (!displayName) {
        showFieldError("display_name", "Display name is required")
        hasErrors = true
      } else if (displayName.length < 2) {
        showFieldError("display_name", "Display name must be at least 2 characters long")
        hasErrors = true
      }

      if (!phone) {
        showFieldError("phone", "Phone number is required")
        hasErrors = true
      } else if (!isValidPhone(phone)) {
        showFieldError("phone", "Please enter a valid phone number")
        hasErrors = true
      }

      if (hasErrors) {
        e.preventDefault()
      }
    })
  }

  // Forgot password form validation
  const forgotForm = document.getElementById("forgot-password-form")
  if (forgotForm) {
    forgotForm.addEventListener("submit", (e) => {
      const email = document.getElementById("email").value.trim()

      // Clear previous error styling
      clearErrorStyling()

      if (!email) {
        showFieldError("email", "Email is required")
        e.preventDefault()
      } else if (!isValidEmail(email)) {
        showFieldError("email", "Please enter a valid email address")
        e.preventDefault()
      }
    })
  }

  // Reset password form validation
  const resetForm = document.getElementById("reset-password-form")
  if (resetForm) {
    resetForm.addEventListener("submit", (e) => {
      const newPassword = document.getElementById("new_password").value
      const confirmPassword = document.getElementById("confirm_password").value

      // Clear previous error styling
      clearErrorStyling()

      let hasErrors = false

      if (!newPassword) {
        showFieldError("new_password", "New password is required")
        hasErrors = true
      } else if (newPassword.length < 8) {
        showFieldError("new_password", "Password must be at least 8 characters long")
        hasErrors = true
      }

      if (!confirmPassword) {
        showFieldError("confirm_password", "Please confirm your password")
        hasErrors = true
      } else if (newPassword !== confirmPassword) {
        showFieldError("confirm_password", "Passwords do not match")
        hasErrors = true
      }

      if (hasErrors) {
        e.preventDefault()
      }
    })
  }

  // Auto-hide flash messages after 5 seconds
  const flashMessages = document.querySelectorAll(".auth-alert")
  flashMessages.forEach((message) => {
    setTimeout(() => {
      message.style.opacity = "0"
      setTimeout(() => {
        message.remove()
      }, 300)
    }, 5000)
  })

  // Social login buttons (placeholder functionality)
  const socialButtons = document.querySelectorAll(".social-button")
  socialButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showAlert("Social login is not implemented in this demo.", "info")
    })
  })
})

// Helper functions
function calculatePasswordStrength(password) {
  if (!password) return 0

  let strength = 0

  // Length check
  if (password.length >= 8) strength += 1
  if (password.length >= 12) strength += 1

  // Character variety checks
  if (/[a-z]/.test(password)) strength += 1
  if (/[A-Z]/.test(password)) strength += 1
  if (/[0-9]/.test(password)) strength += 1
  if (/[^A-Za-z0-9]/.test(password)) strength += 1

  // Bonus for very long passwords
  if (password.length >= 16) strength += 1

  return Math.min(4, strength)
}

function isValidEmail(email) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailPattern.test(email)
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId)
  if (field) {
    field.style.borderColor = "#ef4444"
    field.style.boxShadow = "0 0 0 3px rgba(239, 68, 68, 0.2)"

    // Create or update error message
    let errorElement = field.parentElement.querySelector(".field-error")
    if (!errorElement) {
      errorElement = document.createElement("div")
      errorElement.className = "field-error"
      errorElement.style.color = "#ef4444"
      errorElement.style.fontSize = "0.875rem"
      errorElement.style.marginTop = "0.25rem"
      field.parentElement.appendChild(errorElement)
    }
    errorElement.textContent = message
  }
}

function clearErrorStyling() {
  // Remove error styling from all fields
  const fields = document.querySelectorAll("input")
  fields.forEach((field) => {
    field.style.borderColor = ""
    field.style.boxShadow = ""
  })

  // Remove error messages
  const errorElements = document.querySelectorAll(".field-error")
  errorElements.forEach((element) => {
    element.remove()
  })
}

function showAlert(message, type = "info") {
  const alertDiv = document.createElement("div")
  alertDiv.className = `auth-alert ${type}`
  alertDiv.innerHTML = `
    <i class="fas ${type === "error" ? "fa-exclamation-circle" : "fa-info-circle"}"></i>
    <span>${message}</span>
  `

  const authCard = document.querySelector(".auth-card")
  const firstForm = authCard.querySelector(".auth-form")
  authCard.insertBefore(alertDiv, firstForm)

  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertDiv.style.opacity = "0"
    setTimeout(() => {
      alertDiv.remove()
    }, 300)
  }, 5000)
}

function isValidPhone(phone) {
  // Remove all non-digit characters except + at the beginning
  const cleanPhone = phone.replace(/[^\d+]/g, "")

  // Check for various valid phone number patterns
  const patterns = [
    // UK numbers: 01275249067, +441275249067, 441275249067
    /^(\+44|44|0)?[1-9]\d{8,10}$/,
    // US numbers: +1234567890, 1234567890, (123) 456-7890
    /^(\+1|1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/,
    // International format: +[country code][number]
    /^\+[1-9]\d{1,14}$/,
    // General pattern for most countries (7-15 digits)
    /^(\+\d{1,3}[- ]?)?\d{7,15}$/,
  ]

  // Check if the clean phone matches any pattern
  const isValid = patterns.some((pattern) => pattern.test(cleanPhone))

  // Additional check: must have at least 7 digits total
  const digitCount = cleanPhone.replace(/[^\d]/g, "").length

  return isValid && digitCount >= 7 && digitCount <= 15
}
