import React from 'react';
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import { TouchableOrbitControls } from './utils';

// const OrbitControls = oc(THREE);

type MeshViewerProps = {
  className?: string;
  url?: string;
  gltf?: string;
};

export class MeshViewer extends React.Component<MeshViewerProps, {}> {
  private threeMountRef = React.createRef<HTMLDivElement>();

  private gltfLoader: GLTFLoader = new GLTFLoader();

  private renderer?: THREE.WebGLRenderer;

  private camera?: THREE.OrthographicCamera;

  private controls?: any;

  private windowResizeListener?: any;

  componentDidMount() {
    if (!this.threeMountRef.current) {
      return;
    }
    // === THREE.JS CODE START ===
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    const width = this.threeMountRef.current.clientWidth;
    const height = this.threeMountRef.current.clientHeight;
    this.renderer.setSize(width, height, false);
    this.renderer.setClearColor(0);
    this.threeMountRef.current.appendChild(this.renderer.domElement);
    const self = this;
    this.windowResizeListener = () => self.handleWindowResize();
    window.addEventListener(`resize`, this.windowResizeListener);

    const scene = new THREE.Scene();
    // this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera = new THREE.OrthographicCamera(
      width / -20,
      width / 20,
      height / 20,
      height / -20,
      0.1,
      1000,
    );
    this.controls = new TouchableOrbitControls(
      this.camera,
      this.renderer.domElement,
    );
    this.controls.target.set(0, 0, 0);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.autorotate = true;

    let dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.set(-20, 0, 50);
    scene.add(dirLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.set(-20, 0, -50);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    this.resetCamera();

    const { renderer } = this;
    const { camera } = this;
    const { controls } = this;
    let meshURL = ``;

    if (this.props.gltf) {
      meshURL = this.props.gltf;
      this.controls.enableZoom = true;
      this.controls.enablePan = true;
      this.controls.autorotate = false;
    } else if (this.props.url) {
      meshURL = this.props.url;
    }

    this.gltfLoader.load(
      meshURL,
      (gltf) => {
        const gltfScene = gltf.scene;

        const phongMaterial = new THREE.MeshPhongMaterial({
          shininess: 200,
          flatShading: true,
        });
        phongMaterial.vertexColors = true;

        gltfScene.traverse((o: any) => {
          if (o instanceof THREE.Mesh && o.isMesh) {
            const meshO = o;
            meshO.material = phongMaterial;
            meshO.material.needsUpdate = true;
          }
        });

        const bbox = new THREE.Box3().setFromObject(gltfScene);
        const c = new THREE.Vector3();
        bbox.getCenter(c);
        gltfScene.position.set(-c.x, -c.y, -c.z);
        scene.add(gltfScene);

        let mixer: THREE.AnimationMixer | undefined;
        if (gltf.animations && gltf.animations.length > 0) {
          const clip = gltf.animations[0];
          mixer = new THREE.AnimationMixer(gltfScene);
          const action = mixer.clipAction(clip);
          action.play();
        }
        const clock = new THREE.Clock();

        const animate = () => {
          requestAnimationFrame(animate);
          if (mixer) {
            mixer.update(clock.getDelta());
          }
          controls.update();
          renderer.render(scene, camera);
        };
        animate();
      },
      undefined,
      (error) => {
        console.error(error);
      },
    );
    this.handleWindowResize();
  }

  componentWillUnmount() {
    window.removeEventListener(`resize`, this.windowResizeListener);
    if (this.threeMountRef && this.threeMountRef.current && this.renderer) {
      this.threeMountRef.current.removeChild(this.renderer.domElement);
    }
  }

  handleWindowResize() {
    if (
      !this.threeMountRef ||
      !this.threeMountRef.current ||
      !this.camera ||
      !this.renderer
    ) {
      return;
    }

    const width = this.threeMountRef.current.clientWidth;
    const height = this.threeMountRef.current.clientHeight;

    let zoom = 17;
    if (window.innerHeight > window.innerWidth) {
      zoom = 11;
    }

    this.camera.left = width / -zoom;
    this.camera.right = width / zoom;
    this.camera.top = height / zoom;
    this.camera.bottom = height / -zoom;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
  }

  resetCamera() {
    if (!this.camera || !this.controls) {
      return;
    }
    this.camera.position.setFromSphericalCoords(
      40,
      THREE.MathUtils.degToRad(45),
      -THREE.MathUtils.degToRad(0),
    );
    this.controls.autorotate = true;
    this.controls.update();
  }

  render() {
    return (
      <div
        ref={this.threeMountRef}
        style={{ width: `100%`, height: `100%`, minHeight: `300px` }}
        className={`three-orbit ${this.props.className || ''}`.trim()}
      />
    );
  }
}
