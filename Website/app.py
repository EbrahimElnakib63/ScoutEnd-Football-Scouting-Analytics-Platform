from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import plotly.utils as pu
import numpy as np
import json
import re
import os
import google.generativeai as genai
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = 'football_scouting_secret_key_2024'

# Initialize Supabase client with direct values
supabase: Client = create_client(
    "https://yrtcitohehotzrmmfyyi.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlydGNpdG9oZWhvdHpybW1meXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDk0NDAsImV4cCI6MjA2NDg4NTQ0MH0.SsGmZoas9wcHmzKz-_u6xMrOTwPJJs3XnJCjBDDe46M"
)

GEMINI_API_KEY = "AIzaSyCzc76sKSl1HmUdG_PCovOFG6w8OJyXtlY"

def convert_market_value(value):
    """Convert market value string (e.g., '35M') to float"""
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        # Remove 'M' suffix and convert to float
        return float(value.replace('M', '').strip())
    return 0.0  # Default value if conversion fails

def is_valid_phone(phone):
    """Validate phone number with support for various international formats"""
    if not phone:
        return False
    
    # Remove all non-digit characters except + at the beginning
    clean_phone = re.sub(r'[^\d+]', '', phone)
    
    # Check for various valid phone number patterns
    patterns = [
        # UK numbers: 01275249067, +441275249067, 441275249067
        r'^(\+44|44|0)?[1-9]\d{8,10}$',
        # US numbers: +1234567890, 1234567890
        r'^(\+1|1)?[2-9]\d{2}[2-9]\d{2}\d{4}$',
        # International format: +[country code][number]
        r'^\+[1-9]\d{1,14}$',
        # General pattern for most countries (7-15 digits)
        r'^(\+\d{1,3})?[1-9]\d{6,14}$'
    ]
    
    # Check if the clean phone matches any pattern
    for pattern in patterns:
        if re.match(pattern, clean_phone):
            # Additional check: must have at least 7 digits total
            digit_count = len(re.sub(r'[^\d]', '', clean_phone))
            if 7 <= digit_count <= 15:
                return True
    
    return False

# Load data
def load_data():
    df_player = pd.read_csv('static/data/2024.csv')
    
    # Remove duplicates based on player name, keeping the first occurrence
    df_player = df_player.drop_duplicates(subset=['player'], keep='first')
    
    # Remove players with age 0
    df_player = df_player[df_player['age'] > 0]
    
    # Remove players with identical name, age, goals, and assists
    df_player = df_player.drop_duplicates(
        subset=['player', 'age', 'Performance_Gls', 'Performance_Ast'],
        keep='first'
    )
    
    xg_predictions = pd.read_csv('static/data/xg_predictions_2025.csv')
    xa_predictions = pd.read_csv('static/data/xa_predictions_2025.csv')
    
    df_player = df_player.merge(
        xg_predictions[['player', 'predicted_goals_ensemble_2025']], 
        on='player', 
        how='left'
    )
    
    df_player = df_player.merge(
        xa_predictions[['player', 'predicted_assists_ensemble_2025']], 
        on='player', 
        how='left'
    )
    
    return df_player

# Global data
df_player = load_data()

def get_player_similarity(df_player, player_name):
    """Calculate player similarity and return similar players dataframe"""
    df_player_norm = df_player.copy()

    # Map positions to numerical values for analysis
    custom_mapping = {
        'GK': 1,
        'DF,FW': 4,
        'MF,FW': 8,
        'DF': 2,
        'DF,MF': 3,
        'MF,DF': 5,
        'MF': 6,
        'FW,DF': 7,
        'FW,MF': 9,
        'FW': 10
    }

    # Apply position mapping
    df_player_norm['pos'] = df_player_norm['pos'].map(lambda x: custom_mapping.get(x, 6))  # Default to MF if not found

    # Select features for similarity calculation
    selected_features = [
        'pos', 'age', 'Int', 'Clr', 'KP', 'PPA', 'CrsPA', 'PrgP', 
        'Playing Time_MP', 'Performance_Gls', 'Performance_Ast', 'Performance_G+A',
        'Performance_G-PK', 'Expected_xG', 'Expected_npxG', 'Expected_xAG',
        'Expected_xA', 'Progression_PrgC', 'Progression_PrgP', 'Progression_PrgR',
        'Tackles_Tkl', 'Tackles_TklW', 'SCA_SCA', 'GCA_GCA'
    ]
    
    # Filter features that exist in the dataframe
    selected_features = [feat for feat in selected_features if feat in df_player_norm.columns]

    # Normalize data
    scaler = MinMaxScaler()
    df_player_norm[selected_features] = scaler.fit_transform(df_player_norm[selected_features].fillna(0))

    # Calculate similarity
    similarity = cosine_similarity(df_player_norm[selected_features].fillna(0))

    # Find the index of the selected player
    index_player = df_player.index[df_player['player'] == player_name].tolist()[0]

    # Get similarity scores
    similarity_score = list(enumerate(similarity[index_player]))
    similar_players = sorted(similarity_score, key=lambda x: x[1], reverse=True)

    # Get similar players data
    similar_players_data = []
    for player in similar_players[1:11]:  # Skip the first one as it's the selected player
        index = player[0]
        player_data = df_player.iloc[index]
        similar_players_data.append(player_data)

    return pd.DataFrame(similar_players_data)

def create_radar_chart(player_name, similar_players_df, categories):
    """Create a radar chart for player comparison"""
    fig = go.Figure()

    primary_color = '#4f46e5'  
    secondary_color = '#10b981'  
    text_color = '#1e293b' 
    grid_color = 'rgba(0,0,0,0.1)'  
    bg_color = 'rgba(255,255,255,0.9)'  

    # Add the selected player to the radar chart
    player_row = df_player.loc[df_player['player'] == player_name].iloc[0]
    values = [player_row[col] if pd.notna(player_row[col]) else 0 for col in categories]
    
    fig.add_trace(go.Scatterpolar(
        r=values,
        theta=categories,
        fill='toself',
        name=player_name,
        line=dict(color=primary_color, width=2)
    ))

    # Add similar players to the radar chart
    selected_players = similar_players_df.head(5)  # Limit to top 5 for better visualization
    colors = [secondary_color, '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    
    for i, (_, player_row) in enumerate(selected_players.iterrows()):
        player_name = player_row['player']
        values = [player_row[col] if pd.notna(player_row[col]) else 0 for col in categories]
        
        fig.add_trace(go.Scatterpolar(
            r=values,
            theta=categories,
            fill='toself',
            name=player_name,
            opacity=0.7,
            line=dict(color=colors[i % len(colors)], width=2)
        ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                linewidth=1,
                gridwidth=1,
                gridcolor=grid_color,
                range=[0, max([max(values) for values in [fig.data[i].r for i in range(len(fig.data))]]) * 1.1]
            ),
            angularaxis=dict(
                gridwidth=1,
                gridcolor=grid_color
            ),
            bgcolor=bg_color
        ),
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.2,
            xanchor="center",
            x=0.5,
            bgcolor=bg_color,
            bordercolor=grid_color,
            borderwidth=1
        ),
        autosize=True,
        margin=dict(l=20, r=20, t=30, b=80),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    
    return json.dumps(fig, cls=pu.PlotlyJSONEncoder)

def create_bar_chart(data, x, y, title, color=None):
    """Create a bar chart"""
    fig = px.bar(
        data, 
        x=x, 
        y=y, 
        title=title,
        color=color,
        color_discrete_sequence=['#4f46e5', '#10b981', '#f59e0b', '#ef4444']
    )
    
    fig.update_layout(
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        margin=dict(l=40, r=40, t=50, b=40),
        title_font=dict(size=16),
        xaxis=dict(
            showgrid=True,
            gridwidth=1,
            gridcolor='rgba(0,0,0,0.1)'
        ),
        yaxis=dict(
            showgrid=True,
            gridwidth=1,
            gridcolor='rgba(0,0,0,0.1)'
        ),
        autosize=True,
        height=None  # Let the container determine the height
    )
    
    return json.dumps(fig, cls=pu.PlotlyJSONEncoder)

def create_pie_chart(values, names, title):
    """Create a pie chart"""
    fig = px.pie(
        values=values,
        names=names,
        title=title,
        color_discrete_sequence=['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    )
    
    fig.update_layout(
        margin=dict(l=20, r=20, t=50, b=20),
        title_font=dict(size=16),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.2,
            xanchor="center",
            x=0.5
        ),
        autosize=True,
        height=None  # Let the container determine the height
    )
    
    return json.dumps(fig, cls=pu.PlotlyJSONEncoder)

@app.route('/')
def index():
    """Main route for the application"""
    # Get all player names for the search dropdown
    player_names = df_player['player'].tolist()
    
    # Get all teams for team chemistry
    all_teams = sorted(df_player['team'].unique().tolist())
    
    # Get all nations for filtering
    all_nations = sorted(df_player['nation'].unique().tolist())
    
    # Get all general positions
    all_positions = sorted(df_player['pos'].unique().tolist())
    
    # Get all preferred feet
    all_feet = sorted(df_player['foot'].unique().tolist()) if 'foot' in df_player.columns else []
    
    # Get market value range - handle 'M' suffix
    market_min = 0
    market_max = 100
    if 'market_value' in df_player.columns:
        try:
            # Convert market values to float by removing 'M' suffix
            market_values = df_player['market_value'].apply(convert_market_value)
            market_min = market_values.min()
            market_max = market_values.max()
        except Exception as e:
            print(f"Error processing market values: {e}")
    
    return render_template('index.html', 
                          player_names=player_names,
                          all_teams=all_teams,
                          all_nations=all_nations,
                          all_positions=all_positions,
                          all_feet=all_feet,
                          market_min=market_min,
                          market_max=market_max)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        try:
            # Sign in with Supabase
            response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user:
                # Store only the necessary user information in session
                session['user'] = {
                    'email': response.user.email,
                    'id': response.user.id
                }
                flash('Successfully logged in!', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Invalid email or password', 'error')
                return redirect(url_for('login'))
                
        except Exception as e:
            flash('An error occurred during login', 'error')
            return redirect(url_for('login'))
            
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        fullname = request.form.get('fullname')
        display_name = request.form.get('display_name')
        phone = request.form.get('phone')
        
        # Validate input
        if not all([email, password, confirm_password, fullname, display_name, phone]):
            flash('Please fill in all fields', 'error')
            return render_template('signup.html')
        
        # Validate phone number using the improved function
        if not is_valid_phone(phone):
            flash('Please enter a valid phone number (e.g., 01275249067, +441275249067)', 'error')
            return render_template('signup.html')

        # Clean phone number for storage
        clean_phone = re.sub(r'[^\d+]', '', phone)

        # Validate display name
        if len(display_name.strip()) < 2:
            flash('Display name must be at least 2 characters long', 'error')
            return render_template('signup.html')
        
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            flash('Please enter a valid email address', 'error')
            return render_template('signup.html')
        
        # Validate password strength
        if len(password) < 8:
            flash('Password must be at least 8 characters long', 'error')
            return render_template('signup.html')
        
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('signup.html')
        
        try:
            # Create user with Supabase
            response = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": fullname,
                        "display_name": display_name,
                        "phone": clean_phone
                    },
                    "email_redirect_to": None
                }
            })
            
            if response.user:
                # Automatically sign in the user after successful signup
                try:
                    login_response = supabase.auth.sign_in_with_password({
                        "email": email,
                        "password": password
                    })
                    
                    if login_response.user:
                        # Set session data
                        session['user'] = {
                            'email': login_response.user.email,
                            'id': login_response.user.id
                        }
                        if login_response.session:
                            session['access_token'] = login_response.session.access_token
                        
                        flash('Account created successfully! Welcome to Scoutend.', 'success')
                        return redirect(url_for('dashboard'))
                    else:
                        flash('Account created successfully! Please log in with your credentials.', 'success')
                        return redirect(url_for('login'))
                        
                except Exception as login_error:
                    print(f"Auto-login error: {login_error}")
                    flash('Account created successfully! Please log in with your credentials.', 'success')
                    return redirect(url_for('login'))
            else:
                flash('Failed to create account. Please try again.', 'error')
                return render_template('signup.html')
                
        except Exception as e:
            error_message = str(e).lower()
            print(f"Signup error: {e}")
            
            if any(phrase in error_message for phrase in ['user already registered', 'email already exists', 'already registered']):
                flash('An account with this email already exists. Please use a different email or try logging in.', 'error')
            elif 'password' in error_message and 'weak' in error_message:
                flash('Password is too weak. Please use a stronger password with at least 8 characters.', 'error')
            elif 'invalid email' in error_message:
                flash('Please enter a valid email address', 'error')
            elif any(phrase in error_message for phrase in ['network', 'connection', 'timeout']):
                flash('Connection error. Please check your internet connection and try again.', 'error')
            else:
                flash('Failed to create account. Please check your information and try again.', 'error')
            
            return render_template('signup.html')
    
    return render_template('signup.html')

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        
        # Validate input
        if not email:
            flash('Please enter your email address', 'error')
            return render_template('forgot_password.html')
        
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            flash('Please enter a valid email address', 'error')
            return render_template('forgot_password.html')
        
        try:
            # Get the current host and port for proper redirect
            host = request.host
            scheme = request.scheme
            
            # Send password reset email with correct redirect URL
            response = supabase.auth.reset_password_for_email(
                email,
                {
                    "redirect_to": f"{scheme}://{host}/reset_password"
                }
            )
            
            print(f"Password reset response: {response}")  # Debug logging
            
            # Always show success message for security (prevents email enumeration)
            flash('Password reset instructions have been sent to your email if an account exists. Please check your inbox and follow the instructions.', 'success')
            return redirect(url_for('login'))
            
        except Exception as e:
            error_message = str(e).lower()
            print(f"Forgot password error: {e}")  # Debug logging
            
            # Handle specific errors
            if 'too many requests' in error_message or 'rate limit' in error_message:
                flash('Too many password reset requests. Please wait a few minutes before trying again.', 'error')
            elif any(phrase in error_message for phrase in ['network', 'connection', 'timeout']):
                flash('Connection error. Please check your internet connection and try again.', 'error')
            else:
                # For security, always show success message
                flash('Password reset instructions have been sent to your email if an account exists. Please check your inbox.', 'success')
                return redirect(url_for('login'))
            
            return render_template('forgot_password.html')
    
    return render_template('forgot_password.html')

@app.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    # Get tokens from multiple possible sources
    access_token = (
        request.args.get('access_token') or 
        request.args.get('token') or
        request.args.get('access-token') or
        request.args.get('accessToken')
    )
    refresh_token = (
        request.args.get('refresh_token') or 
        request.args.get('refresh-token') or
        request.args.get('refreshToken')
    )
    
    # Debug logging
    print("=== RESET PASSWORD DEBUG ===")
    print("All URL parameters:", dict(request.args))
    print("Access token found:", bool(access_token))
    print("Refresh token found:", bool(refresh_token))
    
    if not access_token:
        print("No access token found, redirecting to forgot password")
        flash('Invalid or expired reset link. Please request a new password reset.', 'error')
        return redirect(url_for('forgot_password'))
    
    if request.method == 'POST':
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        # Validate input
        if not new_password or not confirm_password:
            flash('Please fill in all fields', 'error')
            return render_template('reset_password.html')
        
        # Check if passwords match
        if new_password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('reset_password.html')
        
        # Validate password strength
        if len(new_password) < 8:
            flash('Password must be at least 8 characters long', 'error')
            return render_template('reset_password.html')
        
        try:
            print("Attempting to update password...")
            
            # Set the session with the tokens
            if refresh_token:
                print("Using access_token and refresh_token")
                supabase.auth.set_session(access_token, refresh_token)
            else:
                print("Using access_token only")
                # Try to get user with access token
                user_response = supabase.auth.get_user(access_token)
                print(f"User response: {user_response}")
                
                if user_response.user:
                    # Manually set the session
                    supabase.auth.set_session(access_token, "")
                else:
                    raise Exception("Invalid access token")
            
            # Update the user's password
            print("Updating user password...")
            response = supabase.auth.update_user({
                "password": new_password
            })
            
            print(f"Update response: {response}")
            
            if response.user:
                flash('Password has been reset successfully! Please login with your new password.', 'success')
                return redirect(url_for('login'))
            else:
                flash('Failed to reset password. Please try again.', 'error')
                return render_template('reset_password.html')
                
        except Exception as e:
            error_message = str(e).lower()
            print(f"Password reset error: {e}")  # Debug logging
            
            # Handle specific errors
            if 'expired' in error_message or 'invalid' in error_message:
                flash('Reset link has expired or is invalid. Please request a new password reset.', 'error')
                return redirect(url_for('forgot_password'))
            elif 'password' in error_message and 'weak' in error_message:
                flash('Password is too weak. Please use a stronger password.', 'error')
            elif any(phrase in error_message for phrase in ['network', 'connection', 'timeout']):
                flash('Connection error. Please check your internet connection and try again.', 'error')
            else:
                flash('Error resetting password. Please try again or request a new reset link.', 'error')
            
            return render_template('reset_password.html')
    
    return render_template('reset_password.html')

@app.route('/logout')
def logout():
    try:
        # Sign out from Supabase if we have an access token
        if 'access_token' in session:
            supabase.auth.sign_out()
    except Exception as e:
        print(f"Error during logout: {e}")
    
    session.clear()
    flash('You have been logged out successfully.', 'success')
    return redirect(url_for('login'))

@app.route('/auth_callback')
def auth_callback():
    access_token = request.args.get('access_token')
    refresh_token = request.args.get('refresh_token')
    type = request.args.get('type')
    
    if not access_token:
        flash('Invalid or missing access token', 'error')
        return redirect(url_for('login'))
    
    try:
        # Set the session with the tokens
        if refresh_token:
            supabase.auth.set_session(access_token, refresh_token)
        else:
            # Try to get user with access token
            user_response = supabase.auth.get_user(access_token)
            if user_response.user:
                supabase.auth.set_session(access_token, "")
            else:
                raise Exception("Invalid access token")
        
        # Get user data
        user = supabase.auth.get_user()
        
        if user and user.user:
            # Store user info in session
            session['user'] = {
                'email': user.user.email,
                'id': user.user.id
            }
            if user.session:
                session['access_token'] = user.session.access_token
            
            if type == 'signup':
                flash('Account created successfully! Welcome to Scoutend.', 'success')
            else:
                flash('Successfully logged in!', 'success')
            
            return redirect(url_for('index'))
        else:
            flash('Failed to authenticate user', 'error')
            return redirect(url_for('login'))
            
    except Exception as e:
        print(f"Auth callback error: {e}")
        flash('An error occurred during authentication', 'error')
        return redirect(url_for('login'))

# [All your existing routes remain the same - player_info, generate_scouting_report, etc.]
@app.route('/player_info', methods=['POST'])
def player_info():
    """Get player information"""
    data = request.json
    player_name = data.get('player_name')
    league = data.get('league')  # Get league parameter if provided
    
    if not player_name or player_name not in df_player['player'].values:
        return jsonify({'error': 'Player not found'}), 404
    
    # Get player data
    player_data = df_player[df_player['player'] == player_name].iloc[0].to_dict()
    
    # Convert numpy values to Python native types for JSON serialization
    for key, value in player_data.items():
        if isinstance(value, (np.int64, np.float64)):
            player_data[key] = float(value) if isinstance(value, np.float64) else int(value)
    
    # Get similar players
    similar_players_df = get_player_similarity(df_player, player_name)
    
    # Filter by league if specified
    if league:
        league_filtered_df = similar_players_df[similar_players_df['team'].str.contains(league) | 
                                              similar_players_df['league'].str.contains(league) if 'league' in similar_players_df.columns else False]
        # Only use filtered results if we found some players
        if not league_filtered_df.empty:
            similar_players_df = league_filtered_df
    
    similar_players = similar_players_df[['player', 'nation', 'team', 'pos', 'age', 'nation_img', 'team_img', 'Performance_Gls', 'Performance_Ast', 'player_img']].to_dict('records')
    
    # Create radar chart
    available_categories = [
        'Performance_Gls', 'Performance_Ast', 'KP', 'GCA_GCA', 
        'Int', 'Tackles_TklW', 'Expected_xG', 'Expected_xAG'
    ]
    categories = [cat for cat in available_categories if cat in df_player.columns]
    radar_chart = create_radar_chart(player_name, similar_players_df, categories)
    
    return jsonify({
        'player_data': player_data,
        'similar_players': similar_players,
        'radar_chart': radar_chart
    })

@app.route('/generate_scouting_report', methods=['POST'])
def generate_scouting_report():
    """Generate AI scouting report"""
    data = request.json
    player_name = data.get('player_name')
    
    if not player_name:
        return jsonify({'error': 'Missing player name'}), 400
    
    try:
        # Configure the Google Generative AI client with stored API key
        genai.configure(api_key=GEMINI_API_KEY)
        # Extract player data
        player_data = df_player[df_player['player'] == player_name].iloc[0]
        # Construct the scouting report prompt
        prompt = f"""
        You are a soccer scout and you must be good at finding the best talents in your team.
        I need you to create a scouting report on {player_name}. Can you provide me with a summary of their strengths and weaknesses?
        Here is the data I have on him:

        Player: {player_name}
        Position: {player_data['pos']}
        Age: {player_data['age']}
        Team: {player_data['team']}

        | Statistic                | Value               |
        |--------------------------|---------------------|
        | Playing Time MP          | {player_data['Playing Time_MP']}     |
        | Performance Gls          | {player_data['Performance_Gls']}     |
        | Performance Ast          | {player_data['Performance_Ast']}     |
        | Performance G+A          | {player_data['Performance_G+A']}     |
        | Expected xG              | {player_data['Expected_xG'] if 'Expected_xG' in player_data else 'N/A'}         |
        | Expected xAG             | {player_data['Expected_xAG'] if 'Expected_xAG' in player_data else 'N/A'}        |
        | Predicted Goals 2025     | {player_data['predicted_goals_ensemble_2025'] if 'predicted_goals_ensemble_2025' in player_data else 'N/A'} |
        | Predicted Assists 2025   | {player_data['predicted_assists_ensemble_2025'] if 'predicted_assists_ensemble_2025' in player_data else 'N/A'} |

        Return the scouting report in the following markdown format:

        # Scouting Report for {player_name}

        ## Strengths
        < a list of 1 to 3 strengths >

        ## Weaknesses
        < a list of 1 to 3 weaknesses >

        ## Summary
        < a brief summary of the player's overall performance and if he would be beneficial to the team >
        """

        # Generate scouting report using Google Generative AI
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        report = response.text.strip()
        
        return jsonify({'report': report})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/team_builder', methods=['POST'])
def team_builder():
    """Generate team builder recommendation with enhanced filtering"""
    data = request.json
    game_style = data.get('game_style')
    player_experience = data.get('player_experience')
    league = data.get('league')
    position = data.get('position')  
    nation = data.get('nation')  
    preferred_foot = data.get('preferred_foot')  
    market_value_min = data.get('market_value_min')  
    market_value_max = data.get('market_value_max')  
    player_skills = data.get('player_skills')
    
    if not all([game_style, player_experience, league, player_skills]):
        return jsonify({'error': 'Missing required parameters'}), 400
    
    try:
        # Start with all players and remove duplicates and age 0
        filtered_df = df_player.copy()
        filtered_df = filtered_df.drop_duplicates(subset=['player'], keep='first')
        filtered_df = filtered_df[filtered_df['age'] > 0]
        
        # 1. Filter by league
        if league:
            league_mask = filtered_df['team'].str.contains(league, case=False, na=False)
            if 'league' in filtered_df.columns:
                league_mask = league_mask | filtered_df['league'].str.contains(league, case=False, na=False)
            filtered_df = filtered_df[league_mask]
        
        # 2. Filter by player experience/type
        if player_experience:
            if player_experience == "Veteran":
                filtered_df = filtered_df[filtered_df['age'] >= 30]
            elif player_experience == "Experienced":
                filtered_df = filtered_df[(filtered_df['age'] >= 25) & (filtered_df['age'] < 30)]
            elif player_experience == "Young":
                filtered_df = filtered_df[(filtered_df['age'] >= 21) & (filtered_df['age'] < 25)]
            elif player_experience == "Promising":
                filtered_df = filtered_df[filtered_df['age'] < 21]
        
        # 3. Filter by general position
        if position:
            filtered_df = filtered_df[filtered_df['pos'] == position]
        
        # 4. Filter by nation
        if nation:
            filtered_df = filtered_df[filtered_df['nation'] == nation]
        
        # 5. Filter by preferred foot
        if preferred_foot and 'foot' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['foot'] == preferred_foot]
        
        # 6. Filter by market value range
        if market_value_min is not None and market_value_max is not None and 'market_value' in filtered_df.columns:
            try:
                min_val = float(market_value_min)
                max_val = float(market_value_max)
                
                # Convert market values to float by removing 'M' suffix and handling different formats
                def convert_market_value(value):
                    if pd.isna(value):
                        return 0.0
                    if isinstance(value, (int, float)):
                        return float(value)
                    if isinstance(value, str):
                        # Remove any currency symbols and 'M' suffix
                        value = value.replace('€', '').replace('$', '').replace('£', '').replace('M', '')
                        try:
                            return float(value)
                        except ValueError:
                            return 0.0
                    return 0.0

                filtered_df['market_value_float'] = filtered_df['market_value'].apply(convert_market_value)
                
                # Apply filter using the converted values
                filtered_df = filtered_df[(filtered_df['market_value_float'] >= min_val) & 
                                        (filtered_df['market_value_float'] <= max_val)]
                
                # Drop the temporary column
                filtered_df = filtered_df.drop('market_value_float', axis=1)
            except (ValueError, TypeError) as e:
                print(f"Error filtering by market value: {e}")
                # If conversion fails, skip this filter
                pass
        
        # 7. Filter by player skills
        skill_to_stat_mapping = {
            "Key Passing": ["KP", "PPA", "CrsPA"],
            "Dribbling": ["Progression_PrgC"],
            "Speed": ["pace"],
            "Shooting": ["Performance_Gls", "Expected_xG"],
            "Defending": ["Int", "Clr", "Tackles_Tkl"],
            "Aerial Ability": ["Clr"],
            "Tackling": ["Tackles_Tkl", "Tackles_TklW"],
            "Vision": ["KP", "Performance_Ast"],
            "Long Passing": ["PrgP"],
            "Agility": ["Progression_PrgC"],
            "Strength": ["Tackles_TklW"],
            "Ball Control": ["KP", "PPA"],
            "Positioning": ["Expected_xG", "Expected_xAG"],
            "Finishing": ["Performance_Gls", "Expected_xG"],
            "Crossing": ["CrsPA"],
            "Marking": ["Int"],
            "Work Rate": ["Playing Time_MP"],
            "Stamina": ["Playing Time_MP"],
            "Free Kicks": ["Performance_Gls"],
            "Leadership": ["Playing Time_MP"]
        }
        
        # Create a score for each player based on the requested skills
        filtered_df['skill_score'] = 0
        
        for skill in player_skills:
            if skill in skill_to_stat_mapping:
                stats = skill_to_stat_mapping[skill]
                for stat in stats:
                    if stat in filtered_df.columns:
                        # Normalize the stat to 0-1 range
                        if filtered_df[stat].max() > filtered_df[stat].min():
                            normalized_stat = (filtered_df[stat] - filtered_df[stat].min()) / (filtered_df[stat].max() - filtered_df[stat].min())
                            filtered_df['skill_score'] += normalized_stat
        
        # Sort by skill score and keep top 50%
        if not filtered_df.empty and 'skill_score' in filtered_df.columns:
            filtered_df = filtered_df.sort_values('skill_score', ascending=False)
            filtered_df = filtered_df.head(max(10, len(filtered_df) // 2))  # Keep at least 10 players
        
        # 8. Filter by game style
        game_style_to_stat_mapping = {
            "Tiki-Taka": ["KP", "PPA", "PrgP"],
            "Counter-Attack": ["Progression_PrgP", "Progression_PrgR", "Performance_Gls"],
            "High Press": ["Int", "Tackles_Tkl", "Tackles_TklW"],
            "Direct Play": ["PrgP", "Performance_Gls"],
            "Pragmatic Possession": ["KP", "PPA", "PrgP"],
            "Reactive": ["Int", "Tackles_Tkl", "Performance_Ast"],
            "Physical and Defensive": ["Int", "Clr", "Tackles_Tkl"],
            "Positional Play": ["KP", "PPA", "PrgP"],
            "Catenaccio": ["Int", "Clr", "Tackles_Tkl"],
            "Long Ball": ["PrgP", "Performance_Gls"]
        }
        
        # Create a game style score for each player
        filtered_df['style_score'] = 0
        
        if game_style in game_style_to_stat_mapping:
            stats = game_style_to_stat_mapping[game_style]
            for stat in stats:
                if stat in filtered_df.columns:
                    # Normalize the stat to 0-1 range
                    if filtered_df[stat].max() > filtered_df[stat].min():
                        normalized_stat = (filtered_df[stat] - filtered_df[stat].min()) / (filtered_df[stat].max() - filtered_df[stat].min())
                        filtered_df['style_score'] += normalized_stat
            
            # Sort by style score and keep top 50%
            if not filtered_df.empty and 'style_score' in filtered_df.columns:
                filtered_df = filtered_df.sort_values('style_score', ascending=False)
                filtered_df = filtered_df.head(max(10, len(filtered_df) // 2))  # Keep at least 10 players
        
        # Combine scores and get top 5 players
        if not filtered_df.empty:
            filtered_df['combined_score'] = filtered_df['skill_score'] + filtered_df['style_score']
            filtered_df = filtered_df.sort_values('combined_score', ascending=False).head(5)
        
        if filtered_df.empty:
            return jsonify({
                'error': f'No suitable players found with the selected criteria. Please try different parameters.'
            }), 400
        
        # Configure the Google Generative AI client with stored API key
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Game styles descriptions
        game_styles = {
            "Tiki-Taka": "This style of play focuses on ball possession, control, and accurate passing.",
            "Counter-Attack": "Teams adopting a counter-attacking style focus on solid defense and rapid advancement in attack when they regain possession.",
            "High Press": "This style involves intense pressure on the opposing team from their half of the field.",
            "Direct Play": "This style of play is more direct and relies on long and vertical passes.",
            "Pragmatic Possession": "Some teams aim to maintain ball possession as part of a defensive strategy.",
            "Reactive": "In this style, a team adapts to the ongoing game situations, changing tactics based on what is happening on the field.",
            "Physical and Defensive": "Some teams place greater emphasis on solid defense and physical play.",
            "Positional Play": "This style aims to dominate the midfield and create passing triangles to overcome opponent pressure.",
            "Catenaccio": "This style, originating in Italy, focuses on defensive solidity and counterattacks.",
            "Long Ball": "This style involves frequent use of long and direct passes to bypass the opponent's defense."
        }

        # Player experience levels
        player_experience_desc = {
            "Veteran": "A player with a long career and extensive experience in professional football.",
            "Experienced": "A player with experience, but not necessarily in the late stages of their career.",
            "Young": "A player in the early or mid-career, often under 25 years old, with considerable development potential.",
            "Promising": "A young talent with high potential but still needs to fully demonstrate their skills."
        }

        # Leagues
        leagues = {
            "Serie A": "Tactical and defensive football with an emphasis on defensive solidity and tactical play.",
            "Ligue 1": "Open games with a high number of goals and a focus on discovering young talents.",
            "Premier League": "Fast-paced, physical, and high-intensity play with a wide diversity of playing styles.",
            "Bundesliga": "High-pressing approach and the development of young talents.",
            "La Liga": "Possession of the ball and technical play with an emphasis on constructing actions."
        }
        
        # Create the prompt
        prompt = f"""
        You are a football scout AI assistant. Generate a detailed scouting report based on the following team requirements:

        Team Requirements:
        - Style of play: {game_styles[game_style]}
        - Player type: {player_experience_desc[player_experience]}
        - Preferred league: {leagues[league]}
        - Key abilities: {', '.join(player_skills)}
        """
        
        # Add optional filters to prompt if provided
        if position:
            prompt += f"- Position: {position}\n"
        if nation:
            prompt += f"- Nation: {nation}\n"
        if preferred_foot and 'foot' in df_player.columns:
            prompt += f"- Preferred foot: {preferred_foot}\n"
        if market_value_min is not None and market_value_max is not None and 'market_value' in df_player.columns:
            prompt += f"- Market value range: {market_value_min} to {market_value_max} million\n"
        
        prompt += f"""
        Here are the top 5 players that match these criteria:
        {filtered_df[['player', 'team', 'age', 'pos', 'nation', 'foot' if 'foot' in filtered_df.columns else None, 'market_value' if 'market_value' in filtered_df.columns else None, 'Performance_Gls', 'Performance_Ast', 'predicted_goals_ensemble_2025', 'predicted_assists_ensemble_2025']].to_string()}

        Please provide a detailed analysis of these players in the following format:

        # Scouting Report

        ## Team Requirements Analysis
        Explain how each player fits the requested style of play and key abilities.

        ## Player Comparison
        Compare the players based on their statistics and how well they match the requirements.

        ## Recommendation
        Recommend the best player from the list and explain why they are the best fit.
        Include their strengths and potential weaknesses in relation to the team's needs.

        ## Alternative Options
        Mention any other players from the list who could be good alternatives and why.
        """

        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        report = response.text.strip()
        
        # Get recommended player data (top player from the list)
        recommended_player = filtered_df.iloc[0]['player'] if not filtered_df.empty else None
        recommended_player_data = None
        
        if recommended_player and recommended_player in df_player['player'].values:
            player_row = df_player[df_player['player'] == recommended_player].iloc[0]
            recommended_player_data = player_row.to_dict()
            
            # Convert numpy values to Python native types for JSON serialization
            for key, value in recommended_player_data.items():
                if isinstance(value, (np.int64, np.float64)):
                    recommended_player_data[key] = float(value) if isinstance(value, np.float64) else int(value)
        
        return jsonify({
            'report': report,
            'recommended_player': recommended_player,
            'recommended_player_data': recommended_player_data,
            'filtered_players': filtered_df.to_dict('records')
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/player_comparison', methods=['POST'])
def player_comparison():
    """Compare players"""
    data = request.json
    players = data.get('players', [])
    metrics = data.get('metrics', [])
    
    if not players or len(players) < 2 or not metrics:
        return jsonify({'error': 'Need at least 2 players and metrics to compare'}), 400
    
    try:
        # Filter players that exist in the dataframe and remove duplicates and age 0
        df_filtered = df_player.drop_duplicates(subset=['player'], keep='first')
        df_filtered = df_filtered[df_filtered['age'] > 0]
        valid_players = [p for p in players if p in df_filtered['player'].values]
        
        if len(valid_players) < 2:
            return jsonify({'error': 'Not enough valid players to compare'}), 400
        
        # Get player data
        players_data = []
        for player in valid_players:
            player_row = df_filtered[df_filtered['player'] == player].iloc[0]
            player_dict = player_row.to_dict()
            
            # Convert numpy values to Python native types for JSON serialization
            for key, value in player_dict.items():
                if isinstance(value, (np.int64, np.float64)):
                    player_dict[key] = float(value) if isinstance(value, np.float64) else int(value)
            
            players_data.append(player_dict)
        
        # Create radar chart
        valid_metrics = [m for m in metrics if m in df_player.columns]
        
        if not valid_metrics:
            return jsonify({'error': 'No valid metrics to compare'}), 400
        
        # Create radar chart data
        fig = go.Figure()
        
        # Add each player to the radar chart
        colors = ['#4f46e5', '#10b981', '#f59e0b']
        
        for i, player in enumerate(valid_players):
            player_row = df_player.loc[df_player['player'] == player].iloc[0]
            values = [player_row[col] if pd.notna(player_row[col]) else 0 for col in valid_metrics]
            
            fig.add_trace(go.Scatterpolar(
                r=values,
                theta=valid_metrics,
                fill='toself',
                name=player,
                line=dict(color=colors[i % len(colors)], width=2)
            ))
        
        fig.update_layout(
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    linewidth=1,
                    gridwidth=1,
                    gridcolor='rgba(0,0,0,0.1)'
                ),
                angularaxis=dict(
                    gridwidth=1,
                    gridcolor='rgba(0,0,0,0.1)'
                ),
                bgcolor='rgba(255,255,255,0.9)'
            ),
            showlegend=True,
            height=600,
            margin=dict(l=80, r=80, t=30, b=30),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)'
        )
        
        radar_chart = json.dumps(fig, cls=pu.PlotlyJSONEncoder)
        
        # Calculate key differences between players
        differences = []
        if len(valid_players) == 2:
            player_a = valid_players[0]
            player_b = valid_players[1]
            
            player_a_data = df_player[df_player['player'] == player_a].iloc[0]
            player_b_data = df_player[df_player['player'] == player_b].iloc[0]
            
            # Define metrics to compare
            comparison_metrics = [
                ("Performance_Gls", "Goals"),
                ("Performance_Ast", "Assists"),
                ("Expected_xG", "Expected Goals"),
                ("Expected_xAG", "Expected Assists"),
                ("Tackles_TklW", "Successful Tackles"),
                ("KP", "Key Passes"),
                ("predicted_goals_ensemble_2025", "Predicted Goals 2025"),
                ("predicted_assists_ensemble_2025", "Predicted Assists 2025")
            ]
            
            for metric_code, metric_name in comparison_metrics:
                if metric_code in player_a_data and metric_code in player_b_data:
                    val_a = player_a_data[metric_code]
                    val_b = player_b_data[metric_code]
                    
                    if pd.notna(val_a) and pd.notna(val_b) and isinstance(val_a, (int, float)) and isinstance(val_b, (int, float)):
                        if val_a > val_b:
                            pct_diff = ((val_a - val_b) / val_b * 100) if val_b != 0 else float('inf')
                            if pct_diff > 10:  # Only show significant differences
                                differences.append(f"**{player_a}** has {val_a:.1f} {metric_name} ({pct_diff:.1f}% more than {player_b}'s {val_b:.1f})")
                        elif val_b > val_a:
                            pct_diff = ((val_b - val_a) / val_a * 100) if val_a != 0 else float('inf')
                            if pct_diff > 10:  # Only show significant differences
                                differences.append(f"**{player_b}** has {val_b:.1f} {metric_name} ({pct_diff:.1f}% more than {player_a}'s {val_a:.1f})")
        
        return jsonify({
            'players_data': players_data,
            'radar_chart': radar_chart,
            'differences': differences
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/youth_talent_scout', methods=['POST'])
def youth_talent_scout():
    """Find youth talents"""
    data = request.json
    max_age = data.get('max_age', 23)
    positions = data.get('positions', [])
    min_goals = data.get('min_goals', 0)
    min_assists = data.get('min_assists', 0)
    min_predicted_goals = data.get('min_predicted_goals', 0)
    min_predicted_assists = data.get('min_predicted_assists', 0)
    sort_by = data.get('sort_by', 'age')
    sort_ascending = data.get('sort_ascending', True)
    
    try:
        # Apply filters and remove duplicates based on name, age, goals, and assists
        filtered_df = df_player.copy()
        filtered_df = filtered_df.drop_duplicates(
            subset=['player', 'age', 'Performance_Gls', 'Performance_Ast'],
            keep='first'
        )
        filtered_df = filtered_df[filtered_df['age'] > 0]
        
        # Age filter
        filtered_df = filtered_df[filtered_df['age'] <= max_age]
        
        # League filter (if provided)
        league = data.get('league')
        if league:
            filtered_df = filtered_df[filtered_df['team'].str.contains(league) | 
                                     filtered_df['league'].str.contains(league) if 'league' in filtered_df.columns else False]
        
        # Position filter
        if positions:
            filtered_df = filtered_df[filtered_df['pos'].isin(positions)]
        
        # Performance filters
        filtered_df = filtered_df[
            (filtered_df['Performance_Gls'] >= min_goals) &
            (filtered_df['Performance_Ast'] >= min_assists)
        ]
        
        # Apply predicted stats filters if columns exist
        if 'predicted_goals_ensemble_2025' in df_player.columns:
            filtered_df = filtered_df[filtered_df['predicted_goals_ensemble_2025'] >= min_predicted_goals]
        
        if 'predicted_assists_ensemble_2025' in df_player.columns:
            filtered_df = filtered_df[filtered_df['predicted_assists_ensemble_2025'] >= min_predicted_assists]
        
        # Apply sorting if column exists
        if sort_by in filtered_df.columns:
            filtered_df = filtered_df.sort_values(by=sort_by, ascending=sort_ascending)
        
        # Convert to records for JSON serialization
        talents = filtered_df.head(20).to_dict('records')
        
        # Convert numpy values to Python native types for JSON serialization
        for talent in talents:
            for key, value in talent.items():
                if isinstance(value, (np.int64, np.float64)):
                    talent[key] = float(value) if isinstance(value, np.float64) else int(value)
        
        # Find hidden gems
        hidden_gems = []
        if 'predicted_goals_ensemble_2025' in df_player.columns and 'predicted_assists_ensemble_2025' in df_player.columns:
            # Calculate potential improvement
            temp_df = df_player.copy()
            # Remove duplicates for hidden gems calculation
            temp_df = temp_df.drop_duplicates(
                subset=['player', 'age', 'Performance_Gls', 'Performance_Ast'],
                keep='first'
            )
            temp_df['goal_improvement'] = temp_df['predicted_goals_ensemble_2025'] - temp_df['Performance_Gls']
            temp_df['assist_improvement'] = temp_df['predicted_assists_ensemble_2025'] - temp_df['Performance_Ast']
            
            # Filter for players with significant predicted improvement
            gems_df = temp_df[
                (temp_df['age'] <= max_age) &
                ((temp_df['goal_improvement'] > 3) | (temp_df['assist_improvement'] > 3))
            ]
            
            if positions:
                gems_df = gems_df[gems_df['pos'].isin(positions)]
                
            gems_df = gems_df.sort_values(by=['goal_improvement', 'assist_improvement'], ascending=False).head(10)
            
            # Convert to records for JSON serialization
            hidden_gems = gems_df.to_dict('records')
            
            # Convert numpy values to Python native types for JSON serialization
            for gem in hidden_gems:
                for key, value in gem.items():
                    if isinstance(value, (np.int64, np.float64)):
                        gem[key] = float(value) if isinstance(value, np.float64) else int(value)
        
        return jsonify({
            'talents': talents,
            'hidden_gems': hidden_gems
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/team_chemistry', methods=['POST'])
def team_chemistry():
    """Analyze team chemistry"""
    data = request.json
    team_name = data.get('team_name')
    player_name = data.get('player_name')
    
    if not team_name:
        return jsonify({'error': 'Team name is required'}), 400
    
    try:
        # Get team players and remove duplicates based on name, age, goals, and assists
        team_players = df_player.copy()
        team_players = team_players.drop_duplicates(
            subset=['player', 'age', 'Performance_Gls', 'Performance_Ast'],
            keep='first'
        )
        team_players = team_players[team_players['age'] > 0]
        team_players = team_players[team_players['team'] == team_name]
        
        if team_players.empty:
            return jsonify({'error': f'No players found for team {team_name}'}), 404
        
        # Convert to records for JSON serialization
        team_players_data = team_players.to_dict('records')
        
        # Convert numpy values to Python native types for JSON serialization
        for player in team_players_data:
            for key, value in player.items():
                if isinstance(value, (np.int64, np.float64)):
                    player[key] = float(value) if isinstance(value, np.float64) else int(value)
        
        # Nationality analysis
        nation_counts = team_players['nation'].value_counts()
        nation_chart = create_bar_chart(
            data={'Nation': nation_counts.index.tolist(), 'Count': nation_counts.values.tolist()},
            x='Nation',
            y='Count',
            title=f"Nationality Distribution in {team_name}"
        )
        
        # Find players with shared nationalities
        shared_nations = nation_counts[nation_counts > 1].index.tolist()
        shared_nationality_players = {}
        
        for nation in shared_nations:
            shared_nationality_players[nation] = team_players[team_players['nation'] == nation]['player'].tolist()
        
        # Position balance analysis
        position_counts = team_players['pos'].value_counts()
        position_chart = create_pie_chart(
            values=position_counts.values.tolist(),
            names=position_counts.index.tolist(),
            title=f"Position Distribution in {team_name}"
        )
        
        # Player compatibility analysis
        player_compatibility = None
        if player_name:
            # Get player data
            player_data = team_players[team_players['player'] == player_name]
            
            if not player_data.empty:
                player_data = player_data.iloc[0]
                
                # Get player nationality
                player_nation = player_data['nation']
                
                # Find teammates with same nationality
                same_nation_teammates = team_players[
                    (team_players['nation'] == player_nation) & 
                    (team_players['player'] != player_name)
                ]['player'].tolist()
                
                # Define complementary positions
                player_pos = player_data['pos']
                complementary_positions = {
                    'GK': ['DF'],
                    'DF': ['GK', 'MF'],
                    'MF': ['DF', 'FW'],
                    'FW': ['MF'],
                    'DF,MF': ['GK', 'FW'],
                    'MF,FW': ['DF'],
                    'DF,FW': ['MF']
                }
                
                # Find players with complementary positions
                complementary_players = []
                if player_pos in complementary_positions:
                    complementary_pos = complementary_positions[player_pos]
                    
                    for pos in complementary_pos:
                        for idx, teammate in team_players.iterrows():
                            if pos in teammate['pos'] and teammate['player'] != player_name:
                                complementary_players.append(teammate['player'])
                
                # Find potential transfer targets with good chemistry
                potential_targets = df_player.copy()
                # Remove duplicates based on name, age, goals, and assists
                potential_targets = potential_targets.drop_duplicates(
                    subset=['player', 'age', 'Performance_Gls', 'Performance_Ast'],
                    keep='first'
                )
                potential_targets = potential_targets[
                    (potential_targets['nation'] == player_nation) & 
                    (potential_targets['team'] != team_name)
                ].sort_values(by=['Performance_Gls', 'Performance_Ast'], ascending=False).head(5)
                
                potential_targets_data = potential_targets.to_dict('records')
                
                # Convert numpy values to Python native types for JSON serialization
                for player in potential_targets_data:
                    for key, value in player.items():
                        if isinstance(value, (np.int64, np.float64)):
                            player[key] = float(value) if isinstance(value, np.float64) else int(value)
                
                player_compatibility = {
                    'same_nation_teammates': same_nation_teammates,
                    'complementary_players': complementary_players,
                    'potential_targets': potential_targets_data
                }
        
        return jsonify({
            'team_players': team_players_data,
            'nation_chart': nation_chart,
            'shared_nationality_players': shared_nationality_players,
            'position_chart': position_chart,
            'player_compatibility': player_compatibility
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/dashboard_data')
def dashboard_data():
    """Get data for the dashboard"""
    try:
        # Remove duplicate players based on name, age, goals, and assists
        df_filtered = df_player.drop_duplicates(
            subset=['player', 'age', 'Performance_Gls', 'Performance_Ast'],
            keep='first'
        )
        
        # Get top predicted goals players
        top_goals_players = df_filtered.sort_values(by='predicted_goals_ensemble_2025', ascending=False).head(10)
        
        # Get top predicted assists players
        top_assists_players = df_filtered.sort_values(by='predicted_assists_ensemble_2025', ascending=False).head(10)
        
        # Get position-based predictions
        position_predictions = df_filtered.groupby('pos').agg({
            'predicted_goals_ensemble_2025': 'mean',
            'predicted_assists_ensemble_2025': 'mean'
        }).reset_index()
        
        # Get rising stars (young players with high predicted stats)
        rising_stars = df_filtered[
            (df_filtered['age'] <= 21) & 
            ((df_filtered['predicted_goals_ensemble_2025'] > 10) | 
             (df_filtered['predicted_assists_ensemble_2025'] > 10))
        ].sort_values(by=['predicted_goals_ensemble_2025', 'predicted_assists_ensemble_2025'], ascending=False).head(8)
        
        # Convert to records for JSON serialization
        top_goals = top_goals_players[['player', 'team', 'nation', 'pos', 'age', 'predicted_goals_ensemble_2025', 'player_img', 'nation_img', 'team_img']].to_dict('records')
        top_assists = top_assists_players[['player', 'team', 'nation', 'pos', 'age', 'predicted_assists_ensemble_2025', 'player_img', 'nation_img', 'team_img']].to_dict('records')
        position_data = position_predictions.to_dict('records')
        rising_stars_data = rising_stars[['player', 'team', 'nation', 'pos', 'age', 'Performance_Gls', 'Performance_Ast', 'predicted_goals_ensemble_2025', 'predicted_assists_ensemble_2025', 'player_img', 'nation_img', 'team_img']].to_dict('records')
        
        # Convert numpy values to Python native types for JSON serialization
        for records in [top_goals, top_assists, position_data, rising_stars_data]:
            for record in records:
                for key, value in record.items():
                    if isinstance(value, (np.int64, np.float64)):
                        record[key] = float(value) if isinstance(value, np.float64) else int(value)
        
        return jsonify({
            'top_goals': top_goals,
            'top_assists': top_assists,
            'position_predictions': position_data,
            'rising_stars': rising_stars_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/filter')
def filter():
    """Route for the filter page"""
    return render_template('Filter.html')

@app.route('/clubs')
def clubs():
    """Route for the clubs page"""
    return render_template('clubs.html')

@app.route('/club-details')
def club_details():
    """Route for the club details page"""
    club = request.args.get('club')
    league = request.args.get('league')
    season = request.args.get('season')
    
    if not all([club, league, season]):
        return redirect(url_for('clubs'))
        
    return render_template('club-details.html', 
                         club=club,
                         league=league,
                         season=season)

@app.route('/player-details')
def player_details():
    """Route for the player details page"""
    player = request.args.get('player')
    season = request.args.get('season')
    
    if not all([player, season]):
        return redirect(url_for('filter'))
        
    return render_template('player-details.html', 
                         player=player,
                         season=season)

@app.route('/dashboard')
def dashboard():
    """Route for the dashboard page"""
    if 'user' not in session:
        flash('Please login to access the Scout page', 'warning')
        return redirect(url_for('login'))
    
    # Get all player names for the search dropdown
    player_names = df_player['player'].tolist()
    
    # Get all teams for team chemistry
    all_teams = sorted(df_player['team'].unique().tolist())
    
    # Get all nations for filtering
    all_nations = sorted(df_player['nation'].unique().tolist())
    
    # Get all general positions
    all_positions = sorted(df_player['pos'].unique().tolist())
    
    # Get all preferred feet
    all_feet = sorted(df_player['foot'].unique().tolist()) if 'foot' in df_player.columns else []
    
    # Get market value range - handle 'M' suffix
    market_min = 0
    market_max = 100
    if 'market_value' in df_player.columns:
        try:
            # Convert market values to float by removing 'M' suffix
            market_values = df_player['market_value'].apply(convert_market_value)
            market_min = market_values.min()
            market_max = market_values.max()
        except Exception as e:
            print(f"Error processing market values: {e}")
    
    return render_template('dashboard.html', 
                          player_names=player_names,
                          all_teams=all_teams,
                          all_nations=all_nations,
                          all_positions=all_positions,
                          all_feet=all_feet,
                          market_min=market_min,
                          market_max=market_max)

if __name__ == '__main__':
    app.run(debug=True)
