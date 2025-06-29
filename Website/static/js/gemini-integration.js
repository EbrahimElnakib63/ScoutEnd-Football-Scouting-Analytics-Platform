// Function to initialize Gemini API integration
function initGeminiIntegration() {
    console.log("Initializing Gemini API integration...")
  
    // Check if API key is available
    if (!GEMINI_API_KEY) {
      console.error("Gemini API key is missing. Please set GEMINI_API_KEY variable.")
      return false
    }
  
    return true
  }
  
  // Global variable for API key
  const GEMINI_API_KEY = "AIzaSyBy7y5Wzl9JkXsG3DOvs7LFGhWwbj97ZKg"
  // Updated API URL to use the latest endpoint
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
  
  // Function to call Gemini API
  async function callGeminiAPI(prompt) {
    try {
      console.log("Calling Gemini API with prompt:", prompt)
  
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      })
  
      if (!response.ok) {
        console.error(`Gemini API error: ${response.status} - ${response.statusText}`)
        console.error("Full response:", await response.text())
        throw new Error(`Gemini API error: ${response.status}`)
      }
  
      const data = await response.json()
      console.log("Gemini API response received")
  
      // Extract the response text from the Gemini API response with better error handling
      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts[0]
      ) {
        console.error("Unexpected Gemini API response format:", data)
        throw new Error("Invalid Gemini API response format")
      }
  
      const responseText = data.candidates[0].content.parts[0].text
  
      // Parse the JSON response
      try {
        return JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", e)
        console.error("Raw response text:", responseText)
        return null
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      return null
    }
  }
  
  // Function to format player data for Gemini
  function formatPlayerDataForGemini(player, currentStats, prevStats) {
    // Implement your data formatting logic here
    // This is a placeholder, replace with actual implementation
    return {
      playerName: player.name,
      currentStats: currentStats,
      prevStats: prevStats,
    }
  }
  
  // Function to validate player data
  function validatePlayerData(playerData) {
    // Implement your data validation logic here
    // This is a placeholder, replace with actual implementation
    if (!playerData || !playerData.playerName) {
      return false
    }
    return true
  }
  
  // Function to create Gemini prompt
  function createGeminiPrompt(playerData) {
    // Implement your prompt creation logic here
    // This is a placeholder, replace with actual implementation
    return `Analyze player ${playerData.playerName} based on current stats: ${JSON.stringify(playerData.currentStats)} and previous stats: ${JSON.stringify(playerData.prevStats)}.`
  }
  
  // Function to handle Gemini API errors
  function handleGeminiApiError(error) {
    console.error("Gemini API error handler:", error)
    return null // Or return a default analysis or error message
  }
  
  // Function to generate player analysis using Gemini
  async function generateGeminiPlayerAnalysis(player, currentStats, prevStats) {
    // Initialize Gemini integration
    if (!initGeminiIntegration()) {
      return null
    }
  
    // Format player data
    const playerData = formatPlayerDataForGemini(player, currentStats, prevStats)
  
    // Validate player data
    if (!validatePlayerData(playerData)) {
      console.warn("Player data validation failed, using fallback analysis")
      return null
    }
  
    // Create prompt
    const prompt = createGeminiPrompt(playerData)
  
    // Call Gemini API
    try {
      const analysisResult = await callGeminiAPI(prompt)
  
      if (!analysisResult) {
        console.warn("No valid analysis returned from Gemini API, using fallback")
        return null
      }
  
      console.log("Gemini analysis generated successfully")
      return analysisResult
    } catch (error) {
      return handleGeminiApiError(error)
    }
  }
  
  