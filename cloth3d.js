// Produkt w 3D (WebGL): zdjęcie przodu i tyłu naciągnięte na gęstą siatkę.
// Materiał faluje, przy obrocie brzegi zostają w tyle, światło przesuwa się po fałdach,
// a na nadruku z dżetów (bluza Polu) migocą pojedyncze punkty.
// Bez WebGL zwraca null i strona używa płaskiej karty.

const Cloth3D = (() => {
  const VS = `
    precision highp float;
    attribute vec2 aUV;
    uniform vec2 uSize;      // szerokość i wysokość produktu w px
    uniform vec2 uCanvas;    // rozmiar płótna w px
    uniform float uBottom;   // położenie dołu produktu (px od środka płótna)
    uniform float uAngle;    // obrót wokół osi pionowej (radiany)
    uniform float uTime, uWave, uSwing, uBob, uPersp;
    varying vec2 vUV;
    varying vec3 vN;
    varying float vZ;

    // wychylenie materiału z płaszczyzny w punkcie (u, v)
    float disp(vec2 p) {
      float free = 0.35 + 0.65 * (1.0 - p.y);          // dół rusza się bardziej niż ramiona
      float w = sin(p.x * 5.5 + uTime * 1.6) * 0.55
              + sin(p.y * 4.2 - uTime * 1.2 + p.x * 2.3) * 0.45
              + sin((p.x + p.y) * 9.0 + uTime * 2.4) * 0.12;
      // przy obrocie brzegi zostają w tyle za środkiem
      float lag = (p.x - 0.5) * abs(p.x - 0.5) * 4.0;
      return uWave * free * w + uSwing * lag * free;
    }
    vec3 pos(vec2 p) {
      float sway = uWave * 0.18 * (1.0 - p.y) * sin(p.y * 3.5 + uTime * 1.1);
      return vec3((p.x - 0.5) * uSize.x + sway * uSize.x * 0.03, uBottom + p.y * uSize.y, disp(p) * uSize.x * 0.035);
    }
    void main() {
      vec3 p = pos(aUV);
      vec3 px = pos(aUV + vec2(0.01, 0.0)) - p;
      vec3 py = pos(aUV + vec2(0.0, 0.01)) - p;
      vec3 n = normalize(cross(px, py));
      float c = cos(uAngle), s = sin(uAngle);
      vec3 r = vec3(p.x * c + p.z * s, p.y + uBob, -p.x * s + p.z * c);
      vN = vec3(n.x * c + n.z * s, n.y, -n.x * s + n.z * c);
      vUV = aUV;
      vZ = r.z;
      float w = uPersp - r.z;
      gl_Position = vec4(r.x * uPersp / (uCanvas.x * 0.5), r.y * uPersp / (uCanvas.y * 0.5), -r.z / 3000.0 * w, w);
    }`;

  const FS = `
    precision highp float;
    uniform sampler2D uFront, uBack;
    uniform float uTime, uSparkle, uGray;
    uniform vec3 uLight;
    varying vec2 vUV;
    varying vec3 vN;
    varying float vZ;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    void main() {
      bool front = gl_FrontFacing;
      // tylna ściana: zdjęcie pleców oglądane od tyłu, więc odbijamy je w poziomie
      vec2 uv = vec2(front ? vUV.x : 1.0 - vUV.x, 1.0 - vUV.y);
      vec4 col = front ? texture2D(uFront, uv) : texture2D(uBack, uv);
      if (col.a < 0.02) discard;
      vec3 n = normalize(front ? vN : -vN);
      vec3 L = normalize(uLight);
      vec3 V = vec3(0.0, 0.0, 1.0);
      float ndl = max(dot(n, L), 0.0);
      // światło dobrane tak, żeby płaski, zwrócony do nas produkt miał kolory jak na zdjęciu
      float shade = 0.8 + 0.32 * ndl;
      vec3 H = normalize(L + V);
      float sheen = pow(max(dot(n, H), 0.0), 28.0) * 0.07;
      vec3 rgb = col.rgb * shade + sheen * col.a;

      if (uSparkle > 0.0 && front) {
        // dżety: jasne miejsca nadruku dzielimy na drobne komórki, każda z lekko innym kątem
        float lum = dot(col.rgb / max(col.a, 0.001), vec3(0.299, 0.587, 0.114));
        float mask = smoothstep(0.5, 0.75, lum) * col.a;
        vec2 grid = vec2(92.0, 98.0);
        vec2 cell = floor(vUV * grid);
        float h = hash(cell);
        vec3 tilt = normalize(n + (vec3(hash(cell + 3.1), hash(cell + 7.7), 0.0) - 0.5) * 1.3);
        float glint = pow(max(dot(reflect(-L, tilt), V), 0.0), 14.0);
        float twinkle = 0.5 + 0.5 * sin(uTime * 2.6 + h * 40.0);
        twinkle *= twinkle;
        vec2 f = fract(vUV * grid) - 0.5;
        // okrągły błysk z krótkimi promieniami w kształcie krzyżyka
        float core = smoothstep(0.42, 0.0, length(f));
        float rays = max(smoothstep(0.1, 0.0, abs(f.x)), smoothstep(0.1, 0.0, abs(f.y))) * smoothstep(0.5, 0.15, length(f));
        float spark = (core + rays * 0.6) * glint * twinkle * mask * step(0.45, h);
        rgb += vec3(1.0, 0.96, 0.85) * spark * 3.2 * uSparkle;
        // cały nadruk lekko połyskuje, gdy światło pada pod dobrym kątem
        rgb += col.rgb * mask * pow(max(dot(n, normalize(L + V)), 0.0), 6.0) * 0.25 * uSparkle;
      }
      float g = dot(rgb, vec3(0.299, 0.587, 0.114));
      rgb = mix(rgb, vec3(g) * 0.8, uGray);
      gl_FragColor = vec4(rgb, col.a);
    }`;

  function create(canvas, onFail = () => {}) {
    const opts = { alpha: true, premultipliedAlpha: true, antialias: true };
    const gl = canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts);
    if (!gl) return null;
    const isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { console.warn('Cloth3D', e); return null; }
    gl.useProgram(prog);
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); onFail(); });

    // siatka 56 × 56 kwadratów (ok. 6 tys. trójkątów, lekka nawet dla słabej karty)
    const N = 56, uv = [], idx = [];
    for (let y = 0; y <= N; y++) for (let x = 0; x <= N; x++) uv.push(x / N, y / N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * (N + 1) + x;
      idx.push(i, i + 1, i + N + 1, i + 1, i + N + 2, i + N + 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    const aUV = gl.getAttribLocation(prog, 'aUV');
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

    const U = {};
    ['uSize', 'uCanvas', 'uBottom', 'uAngle', 'uTime', 'uWave', 'uSwing', 'uBob', 'uPersp', 'uFront', 'uBack', 'uSparkle', 'uGray', 'uLight']
      .forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1i(U.uFront, 0);
    gl.uniform1i(U.uBack, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // tekstury: jedna na plik, wczytywane raz
    const cache = new Map();
    const blank = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, blank);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    function texture(src) {
      if (cache.has(src)) return cache.get(src);
      const t = { tex: null, w: 1, h: 1, ready: false };
      cache.set(src, t);
      const im = new Image();
      im.onload = () => {
        t.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t.tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        // np. strona otwarta prosto z dysku (file://): przeglądarka nie pozwala użyć zdjęcia w WebGL
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); }
        catch (e) { console.warn('Cloth3D', e); onFail(); return; }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (isGL2) {
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        t.w = im.naturalWidth; t.h = im.naturalHeight; t.ready = true;
      };
      im.onerror = () => onFail();
      im.src = src;
      return t;
    }

    const faces = [null, null];
    let dprCap = 1.5;
    return {
      preload(src) { texture(src); },
      setFace(i, src) { faces[i] = texture(src); },
      ready() { return !!(faces[0] && faces[0].ready); },
      // słabszy komputer: mniej pikseli do policzenia
      lowPower() { dprCap = 1; },
      // box: rozmiar pola produktu w px; bottom: odległość dołu produktu od dołu płótna
      draw({ angle, bob, time, wave, swing, sparkle, gray, box, bottom }) {
        const dpr = Math.min(devicePixelRatio || 1, dprCap);
        const cw = canvas.clientWidth, ch = canvas.clientHeight;
        if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
          canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const f = faces[0];
        if (!f || !f.ready) return;
        const b = faces[1] && faces[1].ready ? faces[1] : f;
        const asp = f.w / f.h;
        const w = asp >= 1 ? box : box * asp, h = asp >= 1 ? box / asp : box;
        gl.uniform2f(U.uSize, w, h);
        gl.uniform2f(U.uCanvas, cw, ch);
        gl.uniform1f(U.uBottom, -ch / 2 + bottom);
        gl.uniform1f(U.uAngle, angle * Math.PI / 180);
        gl.uniform1f(U.uTime, time);
        gl.uniform1f(U.uWave, wave);
        gl.uniform1f(U.uSwing, swing);
        gl.uniform1f(U.uBob, bob);
        gl.uniform1f(U.uPersp, 1100);
        gl.uniform1f(U.uSparkle, sparkle);
        gl.uniform1f(U.uGray, gray);
        // światło krąży powoli nad produktem, więc odblaski przesuwają się same
        gl.uniform3f(U.uLight, Math.sin(time * 0.5) * 0.9, 0.55 + Math.sin(time * 0.33) * 0.25, 1.0);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, f.tex);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, b.tex);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      }
    };
  }
  return { create };
})();
