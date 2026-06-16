import { FluidClock } from './FluidClock.js';

class App {
    constructor() {
        this.fluidClock = new FluidClock();
        this.clockVisible = true;
        this.toggleBtn = document.getElementById('toggle-btn');
        
        this.bindEvents();
        this.animate();
        document.fonts.ready.then(() => {
            this.fluidClock.lastTimeStr = ""; 
        });
    }

    bindEvents() {
        this.toggleBtn.addEventListener('click', () => this.toggleClock());

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleClock();
            }
        });

        window.addEventListener('resize', () => this.fluidClock.onWindowResize());
    }

    toggleClock() {
        this.clockVisible = !this.clockVisible;
        this.toggleBtn.innerText = this.clockVisible ? 'HIDE TIME' : 'SHOW TIME';
        this.fluidClock.lastTimeStr = "";
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const targetOpacity = this.clockVisible ? 1.0 : 0.0;
        this.fluidClock.render(targetOpacity);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new App();
});
