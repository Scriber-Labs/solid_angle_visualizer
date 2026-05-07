from flask import Flask, render_template, jsonify, request
import numpy as np
import json
import os

app = Flask(__name__)
app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/calculate_solid_angle', methods=['POST'])
def calculate_solid_angle():
    data = request.get_json()

    try:
        theta_start = float(data.get('theta_start', 0))
        theta_end = float(data.get('theta_end', np.pi / 4))
        phi_start = float(data.get('phi_start', 0))
        phi_end = float(data.get('phi_end', 2 * np.pi))

        theta_start = max(0, min(np.pi, theta_start))
        theta_end = max(0, min(np.pi, theta_end))
        phi_start = max(0, min(2 * np.pi, phi_start))
        phi_end = max(0, min(2 * np.pi, phi_end))

        solid_angle = abs((phi_end - phi_start) * (np.cos(theta_start) - np.cos(theta_end)))

        surface_area = solid_angle

        return jsonify({
            'solid_angle': float(solid_angle),
            'surface_area': float(surface_area),
            'theta_range': [float(theta_start), float(theta_end)],
            'phi_range': [float(phi_start), float(phi_end)]
        })
    except (ValueError, TypeError) as e:
        return jsonify({'error': 'Invalid input parameters'}), 400


@app.route('/api/calculate_differential', methods=['POST'])
def calculate_differential():
    data = request.get_json()

    try:
        theta = float(data.get('theta', np.pi / 4))
        dtheta = float(data.get('dtheta', np.pi / 20))

        theta = max(0, min(np.pi, theta))
        dtheta = max(0.01, min(0.5, dtheta))

        d_omega = 2 * np.pi * np.sin(theta) * dtheta

        theta_start = theta - dtheta / 2
        theta_end = theta + dtheta / 2

        surface_area = d_omega

        sin_theta_value = np.sin(theta)

        return jsonify({
            'differential_solid_angle': float(d_omega),
            'surface_area': float(surface_area),
            'theta': float(theta),
            'dtheta': float(dtheta),
            'theta_range': [float(theta_start), float(theta_end)],
            'sin_theta': float(sin_theta_value),
            'theta_deg': float(np.degrees(theta))
        })
    except (ValueError, TypeError) as e:
        return jsonify({'error': 'Invalid input parameters'}), 400


@app.route('/api/generate_sphere_data', methods=['POST'])
def generate_sphere_data():
    data = request.get_json()
    resolution = int(data.get('resolution', 50))

    theta = np.linspace(0, np.pi, resolution)
    phi = np.linspace(0, 2 * np.pi, resolution)

    vertices = []

    for t in theta:
        for p in phi:
            x = np.sin(t) * np.cos(p)
            y = np.sin(t) * np.sin(p)
            z = np.cos(t)
            vertices.append([float(x), float(y), float(z)])

    return jsonify({
        'vertices': vertices,
        'resolution': resolution
    })


if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
