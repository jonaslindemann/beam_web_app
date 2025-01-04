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



function executeCommand(cmd) {
    ctx.strokeStyle = cmd.stroke_color || currentDrawData.stroke_color;
    ctx.fillStyle = cmd.fill_color || currentDrawData.fill_color;

    switch (cmd.type) {
        case 'line':
            ctx.beginPath();
            ctx.moveTo(cmd.x1, cmd.y1);
            ctx.lineTo(cmd.x2, cmd.y2);
            ctx.stroke();
            break;
        case 'circle':
            ctx.beginPath();
            ctx.arc(cmd.x, cmd.y, cmd.radius, 0, 2 * Math.PI);
            ctx.stroke();
            break;
        case 'rect':
            ctx.beginPath();
            ctx.rect(cmd.x, cmd.y, cmd.width, cmd.height);
            ctx.fill();
            ctx.stroke();
            break;
        case 'arrow':
            drawArrow(cmd);
            break;
        case 'text':
            drawText(cmd);
            break;
        case 'triangle':
            drawTriangle(cmd);
            break;
        case 'polygon':
            drawPolygon(cmd);
            break;
        default:
            console.error('Unknown command:', cmd);
    }
}

function drawArrow(cmd) {
    const headlen = cmd.arrow_size;
    const dx = cmd.x2 - cmd.x1;
    const dy = cmd.y2 - cmd.y1;
    const angle = Math.atan2(dy, dx);

    if (cmd.arrow_start) {
        drawArrowHead(cmd.x1, cmd.y1, angle);
    }

    if (cmd.arrow_end) {
        drawArrowHead(cmd.x2, cmd.y2, angle + Math.PI);
    }

    ctx.beginPath();
    ctx.moveTo(cmd.x1, cmd.y1);
    ctx.lineTo(cmd.x2, cmd.y2);
    ctx.stroke();
}

function drawArrowHead(x, y, angle) {
    const headlen = 0.1; // length of head in pixels
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x, y);
    ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function drawText(cmd) {
    ctx.fillStyle = cmd.color || currentDrawData.text_color;
    ctx.font = `${cmd.font_size}px Arial`;
    ctx.textAlign = cmd.hor_align || 'left';
    ctx.textBaseline = cmd.vert_align || 'middle';

    ctx.save();
    ctx.scale(1, -1);
    ctx.fillText(cmd.text, cmd.x, -cmd.y);
    ctx.restore();
}

function drawTriangle(cmd) {
    ctx.beginPath();
    ctx.moveTo(cmd.x, cmd.y);
    ctx.lineTo(cmd.x - cmd.width / 2.0, cmd.y - cmd.height);
    ctx.lineTo(cmd.x + cmd.width / 2.0, cmd.y - cmd.height);
    ctx.closePath();
    ctx.stroke();
}

function drawPolygon(cmd) {
    ctx.beginPath();
    ctx.moveTo(cmd.points[0][0], cmd.points[0][1]);
    for (let i = 1; i < cmd.points.length; i++) {
        ctx.lineTo(cmd.points[i][0], cmd.points[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

document.addEventListener('DOMContentLoaded', async function () {
    canvas = document.getElementById('modelCanvas');
    ctx = canvas.getContext('2d');

    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        renderView();
    }   

    async function loadInitialModel() {
        try {
            resizeCanvas();
            const response = await fetch('/get_model_view');
            if (response.ok) {
                const data = await response.json();
                updateView(data);
                console.log('Initial model loaded:', data);
            } else {
                console.error('Failed to load initial model:', response.statusText);
            }
        } catch (error) {
            console.error('Error loading initial model:', error);
        }
    }    

    window.addEventListener('resize', resizeCanvas);

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
                } else {
                    console.error('Failed to update model:', response);
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
            const dataValue = this.getAttribute('data-value') || "";

            try {
                const formData = new FormData();
                formData.append('data_value', dataValue);

                const response = await fetch(action, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    updateView(data);
                    if (dataValue !== "") {
                        window.location.href = `/`;
                    }
                } else {
                    console.error('Failed to update model:', response);
                }
            } catch (error) {
                console.error('Error updating model:', error);
            }
        });
    });

    // Load the initial model when the page is loaded

    await loadInitialModel();
});
