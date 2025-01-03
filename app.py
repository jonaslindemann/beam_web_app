import json
from pyexpat import model
from flask import Flask, render_template, session, jsonify, request
import pickle
from beam_model import BeamModel
from beam_widget import BeamWidget

app = Flask(__name__)
app.secret_key = 'your-secret-key'  # Required for session management

def get_model():
    if 'model' not in session:
        model = BeamModel()
        session['model'] = model.to_json()
        session['selected_beam'] = 0

    model = BeamModel()
    model.from_json(session['model'])
    return model

def save_model(model):
    session['selected_beam'] = 0
    session['model'] = model.to_json()

@app.route('/')
def index():
    model = get_model()
    print(model.to_json())
    return render_template('index.html', model=model)

@app.route('/clear_model')
def clear_model():
    model = BeamModel()
    session['selected_beam'] = 0
    session['model'] = model.to_json()
    return render_template('index.html', model=model)

@app.route('/get_model_view')
def get_model_data():
    model = get_model()
    w = BeamWidget(model)
    w.draw()
    return w.to_json()

@app.route('/select_beam', methods=['POST'])
def select_beam():
    session['selected_beam'] = int(request.form['data_value'])
    print(session['selected_beam'])

    return jsonify({'status': 'ok'})

@app.route('/update_model', methods=['POST'])
def update_model():
    model = BeamModel()
    model.from_json(session['model'])
    model.solve()

    beam_length = float(request.form['beam-length'])
    beam_points = int(request.form['beam-points'])
    left_support = int(request.form['left-support'])
    right_support = int(request.form['right-support'])
    beam_load = float(request.form['beam-load'])
    beam_I = float(request.form['beam-I'])
    beam_E = float(request.form['beam-E'])
    beam_A = float(request.form['beam-A'])  

    model.lengths[session['selected_beam']] = beam_length
    model.segments[session['selected_beam']] = beam_points
    model.loads[session['selected_beam']] = beam_load
    model.supports[session['selected_beam']] = left_support
    model.supports[session['selected_beam']+1] = right_support
    model.properties[session['selected_beam']] = [beam_E, beam_A, beam_I]

    save_model(model)
    model.solve()
      
    w = BeamWidget(model)
    w.draw()

    session['model'] = model.to_json()
    return w.to_json()

@app.route('/add_beam', methods=['POST'])
def add_beam():
    model = get_model()
    model.add_segment()
    save_model(model)

    w = BeamWidget(model)
    w.draw()

    return w.to_json()

@app.route('/remove_beam', methods=['POST'])
def remove_beam():
    model = get_model()
    model.remove_segment()
    save_model(model)

    w = BeamWidget(model)
    w.draw()

    return w.to_json()


if __name__ == '__main__':
    app.run(debug=True)