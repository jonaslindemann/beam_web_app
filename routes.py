from flask import Blueprint, render_template, session, request
from beam_model import BeamModel
from beam_widget import BeamWidget

main = Blueprint('main', __name__)

def get_safe_float(request, key, default=0.0):
    try:
        return float(request.form[key])
    except:
        return default

def get_safe_int(request, key, default=0):
    try:
        return int(request.form[key])
    except:
        return default

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

@main.route('/')
def index():
    model = get_model()
    return render_template('index.html', model=model)

@main.route('/clear_model')
def clear_model():
    model = BeamModel()
    session['selected_beam'] = 0
    session['model'] = model.to_json()
    return render_template('index.html', model=model)

@main.route('/get_model_view')
def get_model_data():
    model = get_model()
    model.solve()
    w = BeamWidget(model)
    w.draw()
    return w.to_json()

@main.route('/select_beam', methods=['POST'])
def select_beam():
    session['selected_beam'] = int(request.form['data_value'])
    print(session['selected_beam'])

    model = get_model()
    model.solve()
    
    w = BeamWidget(model)
    w.draw()

    return w.to_json()

@main.route('/update_model', methods=['POST'])
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

@main.route('/add_beam', methods=['POST'])
def add_beam():
    model = get_model()
    model.add_segment()
    save_model(model)

    w = BeamWidget(model)
    w.draw()

    return w.to_json()

@main.route('/remove_beam', methods=['POST'])
def remove_beam():
    model = get_model()
    model.remove_segment()
    save_model(model)

    w = BeamWidget(model)
    w.draw()

    return w.to_json()
