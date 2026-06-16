import { vertexShader, fragmentShader } from './shaders.js';

export class FluidClock {
    constructor() {
        this.clockCanvas = document.createElement('canvas');
        this.ctx = this.clockCanvas.getContext('2d');
        this.lastTimeStr = "";
        this.clockOpacity = 1.0;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clockMaterial = null;
        this.clockTexture = null;
        this.threeClock = new window.THREE.Clock();
        
        this.initWebGL();
        this.resizeClockCanvas();
    }

    resizeClockCanvas() {
        this.clockCanvas.width = window.innerWidth;
        this.clockCanvas.height = window.innerHeight;
        this.lastTimeStr = ""; 
    }

    updateClockCanvas() {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        const s = now.getSeconds().toString().padStart(2, '0');
        
        const currentTimeStr = h + m + s;
        if (currentTimeStr === this.lastTimeStr) return;
        this.lastTimeStr = currentTimeStr;

        const width = this.clockCanvas.width;
        const height = this.clockCanvas.height;

        this.ctx.filter = 'none';
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, width, height);

        const fontSize = Math.floor(width * 0.0648); 
        this.ctx.font = `400 ${fontSize}px 'Plaster', sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.lineJoin = 'round';

        const cy = height / 2;
        const gap = width * 0.18; 
        const cx_h = width / 2 - gap;
        const cx_m = width / 2;
        const cx_s = width / 2 + gap;

        const draw = (fill, strokeWidth) => {
            if(strokeWidth > 0) {
                this.ctx.lineWidth = strokeWidth;
                this.ctx.strokeText(h, cx_h, cy);
                this.ctx.strokeText(m, cx_m, cy);
                this.ctx.strokeText(s, cx_s, cy);
            }
            if(fill) {
                this.ctx.fillText(h, cx_h, cy);
                this.ctx.fillText(m, cx_m, cy);
                this.ctx.fillText(s, cx_s, cy);
            }
        };

        this.ctx.globalCompositeOperation = 'lighter';

        this.ctx.filter = `blur(${width * 0.007}px)`;
        this.ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
        draw(true, 0);

        this.ctx.filter = `blur(${width * 0.002}px)`;
        this.ctx.fillStyle = `rgba(255, 255, 255, 0.30)`;
        draw(true, 0);

        this.ctx.filter = `blur(${width * 0.0005}px)`;
        this.ctx.fillStyle = `rgba(255, 255, 255, 0.50)`;
        draw(true, 0);

        if (this.clockTexture) this.clockTexture.needsUpdate = true;
    }

    initWebGL() {
        const container = document.getElementById('webgl-container');
        this.scene = new window.THREE.Scene();
        this.camera = new window.THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        this.clockTexture = new window.THREE.CanvasTexture(this.clockCanvas);
        this.clockTexture.minFilter = window.THREE.LinearFilter;
        this.clockTexture.magFilter = window.THREE.LinearFilter;

        this.clockMaterial = new window.THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_time: { value: 0.0 },
                u_resolution: { value: new window.THREE.Vector2(window.innerWidth, window.innerHeight) },
                u_heightMap: { value: this.clockTexture },
                u_clockOpacity: { value: 1.0 }
            }
        });

        const geometry = new window.THREE.PlaneGeometry(2, 2);
        const mesh = new window.THREE.Mesh(geometry, this.clockMaterial);
        this.scene.add(mesh);
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.clockMaterial.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
        this.resizeClockCanvas();
    }

    render(targetOpacity) {
        if (Math.abs(this.clockOpacity - targetOpacity) > 0.001) {
            this.clockOpacity += (targetOpacity - this.clockOpacity) * 0.03;
        } else {
            this.clockOpacity = targetOpacity;
        }

        this.updateClockCanvas();
        this.clockMaterial.uniforms.u_time.value = this.threeClock.getElapsedTime();
        this.clockMaterial.uniforms.u_clockOpacity.value = this.clockOpacity;
        this.renderer.render(this.scene, this.camera);
    }
}
