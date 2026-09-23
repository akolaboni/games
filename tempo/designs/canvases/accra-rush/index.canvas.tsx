import { Canvas, Storyboard } from "tempo-sdk/canvas";
import { AccraRushTitle } from "../../../../src/AccraRushDesign";
import { AccraRushPick } from "../../../../src/AccraRushDesign";
import { AccraRushRun } from "../../../../src/AccraRushDesign";
import { AccraRushPause } from "../../../../src/AccraRushDesign";
import { AccraRushGameOver } from "../../../../src/AccraRushDesign";

export default function AccraRushCanvas() {
  return (
    <Canvas name="Accra Rush" backgroundColor="#232323">
      <Storyboard
        id="Title"
        name="Title / Start"
        component={AccraRushTitle}
        layout={{ x: 0, y: 0, width: 1280, height: 720, intrinsicSizing: "root-element" }}
      />
      <Storyboard
        id="SkaterPick"
        name="Choose your rider"
        component={AccraRushPick}
        layout={{ x: 1330, y: 0, width: 1280, height: 720, intrinsicSizing: "root-element" }}
      />
      <Storyboard
        id="ActiveRun"
        name="Active run"
        component={AccraRushRun}
        layout={{ x: 0, y: 770, width: 1280, height: 720, intrinsicSizing: "root-element" }}
      />
      <Storyboard
        id="Pause"
        name="Pause / settings"
        component={AccraRushPause}
        layout={{ x: 0, y: 1540, width: 1280, height: 720, intrinsicSizing: "root-element" }}
      />
      <Storyboard
        id="GameOver"
        name="Run complete"
        component={AccraRushGameOver}
        layout={{ x: 0, y: 2310, width: 1280, height: 720, intrinsicSizing: "root-element" }}
      />
    </Canvas>
  );
}
