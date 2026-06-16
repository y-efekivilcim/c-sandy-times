export const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

export const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform sampler2D u_heightMap;
    uniform float u_clockOpacity;

    varying vec2 vUv;

    float hash(vec2 p) {
        vec3 p3  = fract(vec3(p.xyx) * .1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                   mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
    }

    float getCaustic(vec2 uv, float time) {
        vec2 p = uv * 3.5;
        float c = 0.0;
        float w = 1.0;
        for(int i = 0; i < 3; i++) {
            p += vec2(cos(time * 0.8 + p.y), sin(time * 0.8 + p.x));
            c += abs(sin(p.x + p.y)) * w;
            w *= 0.5;
            p *= 1.8;
        }
        return pow(1.0 - c * 0.4, 4.0);
    }

    float getSandHeight(vec2 uv, vec2 aspectUv, float time) {
        vec2 rippleUv = aspectUv * 28.0;
        rippleUv += noise(aspectUv * 4.0 - time * 0.05) * 2.0;
        float ripple = sin(rippleUv.x - rippleUv.y) * 0.5 + 0.5;
        ripple = pow(ripple, 1.5) * 0.015;

        float dune = noise(aspectUv * 2.0) * 0.04;

        return ripple + dune;
    }

    void main() {
        vec2 uv = vUv;
        float time = u_time * 0.3;
        vec2 aspectUv = uv * vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 px = 1.0 / u_resolution;

        vec2 waveWarp = vec2(
            sin(time * 1.5 + uv.y * 10.0) * 0.012,
            cos(time * 1.3 + uv.x * 8.0) * 0.012
        );
        vec2 textUv = uv + waveWarp;

        float textH = texture2D(u_heightMap, textUv).r * u_clockOpacity;
        textH = smoothstep(0.0, 1.0, textH);
        
        float tR = texture2D(u_heightMap, textUv + vec2(px.x*1.5, 0.0)).r * u_clockOpacity;
        float tU = texture2D(u_heightMap, textUv + vec2(0.0, px.y*1.5)).r * u_clockOpacity;
        
        float waterBumpScale = 2.5;
        vec3 waterNormal = normalize(vec3((textH - tR) * waterBumpScale, (textH - tU) * waterBumpScale, 1.0));

        vec2 refractedAspectUv = aspectUv - waterNormal.xy * 0.015 * textH;
        vec2 refractedUv = uv - waterNormal.xy * 0.015 * textH;
        
        float hC = getSandHeight(refractedUv, refractedAspectUv, time);
        float hR = getSandHeight(refractedUv + vec2(px.x*2., 0.0), refractedAspectUv + vec2(px.x*2., 0.0), time);
        float hU = getSandHeight(refractedUv + vec2(0.0, px.y*2.), refractedAspectUv + vec2(0.0, px.y*2.), time);

        float sandBumpScale = 120.0; 
        vec3 sandNormal = normalize(vec3((hC - hR) * sandBumpScale, (hC - hU) * sandBumpScale, 1.0));

        vec3 sandDark = vec3(0.55, 0.42, 0.25);
        vec3 sandLight = vec3(0.92, 0.82, 0.65);
        
        vec3 albedo = mix(sandDark, sandLight, smoothstep(0.0, 0.25, hC));
        albedo *= mix(0.85, 1.05, hash(refractedUv * 800.0)); 

        vec3 lightDir = normalize(vec3(-0.6, 0.8, 1.2));
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 halfDir = normalize(lightDir + viewDir);

        float diffuse = max(dot(sandNormal, lightDir), 0.0);
        
        vec3 ambient = vec3(0.15, 0.35, 0.45) * 0.6;
        vec3 sun = vec3(1.0, 0.95, 0.8) * diffuse;

        vec3 color = albedo * (ambient + sun);

        vec3 darkTint = color * vec3(0.02, 0.05, 0.12);
        color = mix(color, darkTint, textH * 0.98);

        float textBlend = textH * (0.3 + 0.7 * noise(aspectUv * 25.0 + time * 1.2));

        float waterSpec = pow(max(dot(waterNormal, halfDir), 0.0), 60.0) * 0.4;
        waterSpec += pow(max(dot(waterNormal, halfDir), 0.0), 15.0) * 0.15;
        color += vec3(1.0, 0.95, 0.9) * waterSpec * textBlend * 1.5; 

        vec2 cUv = refractedAspectUv + sandNormal.xy * 0.15 + waterNormal.xy * 0.1; 
        
        float cR = getCaustic(cUv + vec2(0.003, 0.0), time);
        float cG = getCaustic(cUv, time);
        float cB = getCaustic(cUv - vec2(0.003, 0.0), time);
        vec3 caustics = vec3(cR, cG, cB);

        caustics *= smoothstep(0.1, 0.9, diffuse) * 2.5;
        caustics += vec3(cR, cG, cB) * 0.5; 

        caustics *= 1.0 + (textBlend * 2.5);

        color += caustics * vec3(0.85, 0.95, 1.0) * albedo * 1.5;

        float dist = length(uv - 0.5);
        color *= smoothstep(1.2, 0.25, dist);

        gl_FragColor = vec4(color, 1.0);
    }
`;
