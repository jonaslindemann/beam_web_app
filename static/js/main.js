// static/js/main.js
let ctx;
let canvas;
let currentDrawData;
let currentScale;

function updateView(drawData) {
    currentDrawData = drawData;
    renderView();
}

function renderView() {
    if (!currentDrawData) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const modelWidth = currentDrawData.extents[2] - currentDrawData.extents[0];
    const modelHeight = currentDrawData.extents[3] - currentDrawData.extents[1];

    const scaleX = canvas.width / modelWidth;
    const scaleY = canvas.height / modelHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9;

    currentScale = scale;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scale, -scale);
    ctx.translate(
        -(currentDrawData.extents[0] + modelWidth / 2),
        -(currentDrawData.extents[1] + modelHeight / 2)
    );

    ctx.strokeStyle = currentDrawData.stroke_color;
    ctx.fillStyle = currentDrawData.fill_color;
    ctx.lineWidth = currentDrawData.stroke_width / scale;

    for (const cmd of currentDrawData.display_list) {
        executeCommand(cmd);
    }

    ctx.restore();
}

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    renderView();
}

function executeCommand(cmd) {

    if (cmd.type === 'line') {
        ctx.strokeStyle = cmd.stroke_color;
        ctx.beginPath();
        ctx.moveTo(cmd.x1, cmd.y1);
        ctx.lineTo(cmd.x2, cmd.y2);
        ctx.stroke();
    }
    else if (cmd.type === 'circle') {
        ctx.strokeStyle = cmd.stroke_color;
        ctx.beginPath();
        ctx.arc(cmd.x, cmd.y, cmd.radius, 0, 2 * Math.PI);
        //ctx.fill();
        ctx.stroke();
    }
    else if (cmd.type === 'rect') {
        ctx.strokeStyle = cmd.stroke_color;
        ctx.fillStyle = cmd.fill_color;
        ctx.beginPath();
        ctx.rect(cmd.x, cmd.y, cmd.width, cmd.height);
        ctx.fill();

        ctx.beginPath();
        ctx.rect(cmd.x, cmd.y, cmd.width, cmd.height);
        ctx.stroke();
    }
    else if (cmd.type === 'arrow') {
        const headlen = cmd.arrow_size;
        const dx = cmd.x2 - cmd.x1;
        const dy = cmd.y2 - cmd.y1;
        const angle = Math.atan2(dy, dx);

        if (cmd.arrow_start == true) {
            ctx.beginPath();
            ctx.moveTo(cmd.x1, cmd.y1);
            ctx.lineTo(cmd.x1 + headlen * Math.cos(angle - Math.PI / 6), cmd.y1 + headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(cmd.x1, cmd.y1);
            ctx.lineTo(cmd.x1 + headlen * Math.cos(angle + Math.PI / 6), cmd.y1 + headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }

        if (cmd.arrow_end == true) {
            ctx.beginPath();
            ctx.moveTo(cmd.x2, cmd.y2);
            ctx.lineTo(cmd.x2 - headlen * Math.cos(angle - Math.PI / 6), cmd.y2 - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(cmd.x2, cmd.y2);
            ctx.lineTo(cmd.x2 - headlen * Math.cos(angle + Math.PI / 6), cmd.y2 - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(cmd.x1, cmd.y1);
        ctx.lineTo(cmd.x2, cmd.y2);
        ctx.stroke();


    }
    else if (cmd.type === 'text') {
        // Get current transform scale
        // Set text properties
        ctx.fillStyle = cmd.color || currentModelData.text_color;
        ctx.font = `${cmd.font_size}px Arial`;
        ctx.textAlign = cmd.hor_align || 'left';
        ctx.textBaseline = cmd.vert_align || 'middle';

        // Draw text
        ctx.save();
        ctx.scale(1, -1);
        ctx.fillText(cmd.text, cmd.x, -cmd.y);
        ctx.restore();
    }
    else if (cmd.type === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(cmd.x, cmd.y);
        ctx.lineTo(cmd.x - cmd.width / 2.0, cmd.y - cmd.height);
        ctx.lineTo(cmd.x + cmd.width / 2.0, cmd.y - cmd.height);
        ctx.closePath();
        //ctx.fill();
        ctx.stroke();
    }
    else if (cmd.type === 'polygon') {
        ctx.strokeStyle = cmd.stroke_color;
        ctx.fillStyle = cmd.fill_color;

        ctx.beginPath();
        ctx.moveTo(cmd.points[0][0], cmd.points[0][1]);
        for (let i = 1; i < cmd.points.length; i++) {
            ctx.lineTo(cmd.points[i][0], cmd.points[i][1]);
        }
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cmd.points[0][0], cmd.points[0][1]);
        for (let i = 1; i < cmd.points.length; i++) {
            ctx.lineTo(cmd.points[i][0], cmd.points[i][1]);
        }
        ctx.closePath();
        ctx.stroke();
    }
    else {
        console.error('Unknown command:', cmd);
    }
}


document.addEventListener('DOMContentLoaded', async function () {
    canvas = document.getElementById('modelCanvas');
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    try {
        const response = await fetch('/get_model_view');
        if (response.ok) {
            const data = await response.json();
            updateView(data);
            console.log('Initial model loaded:', data);
        }
        else {
            console.error('Failed to load initial model:', response);
        }
    } catch (error) {
        console.error('Error loading initial model:', error);
    }

    const form = document.getElementById('beam-controls');
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const formData = new FormData(form);

        if (e.submitter.value === 'update-model-btn') {

            try {
                const response = await fetch('/update_model', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    updateView(data);
                }
            } catch (error) {
                console.error('Error updating model:', error);
            }
        }
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', async function (e) {
            e.preventDefault();
    
            const action = this.getAttribute('data-action');
            const data_value = this.getAttribute('data-value') || "";
    
            try {
                const formData = new FormData();
                formData.append('data_value', data_value);
                
                const response = await fetch(action, {
                    method: 'POST',
                    body: formData
                });
    
                if (response.ok) {
                    if (data_value === "") {
                        const data = await response.json();
                        updateView(data);
                    } else {
                        // Handle the case with data_value
                        window.location.reload();
                        //window.location.href = '/';
                    }
                }
            } catch (error) {
                console.error('Error updating model:', error);
            }
        });
    });
});