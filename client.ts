import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils'

//setup scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xffffff)

//setup renderer
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
document.getElementById('container')?.appendChild(renderer.domElement)

//setup lights
const downLight = new THREE.DirectionalLight(0xffffff, Math.PI)
downLight.position.set(0, 0, 3)
scene.add(downLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, Math.PI)
directionalLight.position.set(0, 0, 3)
scene.add(directionalLight)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
scene.add(ambientLight)

//setup camera & orbit controls
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(-1, -1, 2)
camera.up.set(0, 0, 1)
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0.75, 0, 0.4)

// Load video
const video = document.createElement('video')
video.src = 'animations/combined.mp4'
video.loop = true
video.playsInline = true

//loop between loopStart and loopEnd
const setLoop =
    (video: HTMLVideoElement, loopStart: number, loopEnd: number, loopEndDelta: number = 0.5) =>
    (ev: Event) => {
        if (video.currentTime >= loopEnd - loopEndDelta) {
            //loop end delta helps account for how often setLoop is run
            video.currentTime = loopStart
        }
    }

//go to video part corresonding to z value, default vals hardcoded for demo movie
function gotoVideoSection(
    video: HTMLVideoElement,
    x: number,
    slice_dt = 10.0,
    slice_dx = 0.05,
    slice_min = 0.05
) {
    //slice_dt is length of animation at a given height
    //slice_dx is the offset between slice movies
    //slice_min is the minimum slice location
    let loopStart = (slice_dt * (x - slice_min)) / slice_dx
    let loopEnd = slice_dt + loopStart
    video.currentTime = loopStart
    video.ontimeupdate = setLoop(video, loopStart, loopEnd)
}

//set up video transparency with custom shader, taken from https://sbcode.net/threejs/webcam/
const videoTexture = new THREE.VideoTexture(video)
videoTexture.format = THREE.RGBAFormat
videoTexture.minFilter = THREE.LinearFilter
videoTexture.magFilter = THREE.LinearFilter
function vertexShader() {
    return `
        varying vec2 vUv;
        void main( void ) {     
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }`
}
function fragmentShader() {
    return `
        uniform vec3 keyColor;
        uniform float similarity;
        uniform float smoothness;
        varying vec2 vUv;
        uniform sampler2D map;
        void main() {
            vec4 videoColor = texture2D(map, vUv);
            float Y1 = 0.299 * keyColor.r + 0.587 * keyColor.g + 0.114 * keyColor.b;
            float Cr1 = keyColor.r - Y1;
            float Cb1 = keyColor.b - Y1;
            float Y2 = 0.299 * videoColor.r + 0.587 * videoColor.g + 0.114 * videoColor.b;
            float Cr2 = videoColor.r - Y2; 
            float Cb2 = videoColor.b - Y2; 
            float blend = smoothstep(similarity, similarity + smoothness, distance(vec2(Cr2, Cb2), vec2(Cr1, Cb1)));
            gl_FragColor = vec4(videoColor.rgb, videoColor.a * blend); 
        }`
}
const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
        map: { value: videoTexture },
        keyColor: { value: [255, 255, 255] },
        similarity: { value: 0.01 },
        smoothness: { value: 0.3 },
    },
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader(),
    side: THREE.DoubleSide,
})

//set up plane video is projected on
let planeDims = [20, 8]
let planeCenter = [5, 0.0, 0.9]
let planeNormal = [0, 0, -1]
const planeGeometry = new THREE.PlaneGeometry(planeDims[0], planeDims[1])
const planeMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide })
if (planeMaterial.map != null) {
    planeMaterial.map.flipY = true
}
const plane = new THREE.Mesh(planeGeometry, material)
plane.lookAt(new THREE.Vector3(planeNormal[0], planeNormal[1], planeNormal[2]))
plane.position.set(planeCenter[0], planeCenter[1], planeCenter[2])
gotoVideoSection(video, planeCenter[2])
scene.add(plane)

//load vehicle body
const objLoader = new OBJLoader()
let body: THREE.Group<THREE.Object3DEventMap>
objLoader.load('models/motorBike.obj', (object) => {
    for (let i = 0; i < object.children.length; i++) {
        let geoMesh = object.children[i] as THREE.Mesh
        let material = new THREE.MeshStandardMaterial({
            color: 0x999999,
            roughness: 0.3,
            metalness: 0,
            transparent: false,
            opacity: 1,
            side: THREE.DoubleSide,
        })
        if (geoMesh.name.includes('tyre')) {
            material['color'] = new THREE.Color('black')
            material['roughness'] = 1
        }
        geoMesh.material = material
        geoMesh.geometry.deleteAttribute('normal') //redo normals for smoothing
        geoMesh.geometry = mergeVertices(geoMesh.geometry)
        geoMesh.geometry.computeVertexNormals()
    }
    scene.add(object)
    body = object
})

//setup GUI elements
let slider = document.getElementById('vslider') as HTMLInputElement
slider?.addEventListener('input', () => {
    gotoVideoSection(video, 0.05 * parseInt(slider?.value))
    plane.position.z = 0.05 * parseInt(slider?.value)
})

let checkbox = document.getElementById('show_body') as HTMLInputElement
checkbox?.addEventListener('change', () => {
    console.log(checkbox.checked)
    body.visible = checkbox.checked
})

document.addEventListener("DOMContentLoaded", function() {
    let playOverlay = document.getElementById("playOverlay");
    let playButton = document.getElementById("playButton");
    playButton?.addEventListener("click", function() {
        playOverlay!.style.display = "none"; // Hide the overlay when play button is clicked
        video.play();
    });
});

//standard THREE.js animate & render
function animate() {
    requestAnimationFrame(animate)
    controls.update()
    directionalLight.position.copy(camera.position)
    render()
}
animate()
function render() {
    renderer.render(scene, camera)
}
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}
