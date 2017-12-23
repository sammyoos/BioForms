const GENERATIONS = 0; // how many generations of detail to add
const STEM_LENGTH = 1; // stem base length
const STEM_RATIO = 2; // stem length ratio from previous generation
const STEM_ABSOLUTE = 3; // stem length absolute difference from previous generation
const BRANCH_ANGLE = 4; // branch angle absolute difference from previous generation
const BRANCH_RATIO = 5; // branch angle ratio difference from previous generation
const BRANCH_OFFSET = 6; // offset of the branch from the end of the branch
const BRANCH_COLOR = 7; // stem color --> will be forced to be a positive number
const BRANCH_CJUMP = 8; // stem color jump offset

const RED_COLORS = [ "#000000", "#1A0000", "#330000", "#4D0000", "#660000", "#800000", "#990000", "#B30000", "#CC0000", "#E60000", "#FF0000", "#FF1A1A", "#FF3333", "#FF4D4D", "#FF6666", "#FF8080", "#FF9999", "#FFB3B3", "#FFCCCC", "#FFE6E6", "#FFFFFF", "#FFE6E6", "#FFCCCC", "#FFB3B3", "#FF9999", "#FF8080", "#FF6666", "#FF4D4D", "#FF3333", "#FF1A1A", "#FF0000", "#E60000", "#CC0000", "#B30000", "#990000", "#800000", "#660000", "#4D0000", "#330000", "#1A0000", "#000000" ];
var RED_LENGTH = RED_COLORS.length;

var defaultWidth = 200;
var defaultHeight = 200;

class Genes {
   constructor(all_characteristics) {
      this.Characteristics = all_characteristics.slice();
   }

   reproduce(mutation) {
      var child = new Genes(this.Characteristics);
      child.Characteristics[mutation] += Genes.mutateNow();

      console.log("Gene successfully reproduced");
      console.log(child.Characteristics);
      return child;
   }

   updateStem(length) {
      length += this.Characteristics[STEM_ABSOLUTE];
      length *= 1 + this.Characteristics[STEM_RATIO] / 10;
      return length;
   }

   updateRotation(rotation) {
      rotation += this.Characteristics[BRANCH_ANGLE] / 100;
      rotation *= 1 + this.Characteristics[BRANCH_RATIO] / 100;
      return rotation;
   }

   updateColor(color) {
      color += this.Characteristics[BRANCH_CJUMP];
      if (color < 0) color += RED_LENGTH;
      if (color >= RED_LENGTH) color %= RED_LENGTH;
      return color;
   }

   toString() {
      return this.Characteristics.join("_");
   }

   static mutateNow() {
      // slight bias towards positive numbers
      return Math.random() * 64 > 30 ? 1 : -1;
   }

   static generateFromString(description) {
      var newCharacteristics = [];
      if (description != "") {
         newCharacteristics = description.split("_").map(x => parseInt(x));
         if (newCharacteristics.length != 9) {
            console.error("Wrong number of Characteristics in Gene");
            console.error("Gene Description: " + description);
            console.error("==> Found " + newCharacteristics.length + " Characteristics");
            console.error(new Error().stack);
            console.error("...resorting to default");
            newCharacteristics = [];
         }
      }

      if (newCharacteristics.length == 0) newCharacteristics = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      return new Genes(newCharacteristics);
   }
}

function main() {
   let url = new URL(window.location.href);
   let results = url.searchParams.get("y");

   if (results) {
      let parentGene = Genes.generateFromString(decodeURIComponent(results));
      let ctx = setupContext("child_0", parentGene.toString());
      if (!ctx) return;

      drawBioMorph(ctx, parentGene);
      return;
   }

   results = url.searchParams.get("x");
   let parentGene = Genes.generateFromString(decodeURIComponent(results));

   var numCharacteristics = parentGene.Characteristics.length;
   for (let i = 0; i < numCharacteristics; ++i) {
      let child = parentGene.reproduce(i);
      let ctx = setupContext("child_" + i, child.toString());
      if (!ctx) return;

      drawBioMorph(ctx, child);
   }
}

function setupContext(id, description) {
   let a_ref = document.getElementById(id);
   a_ref.href = "?x=" + description;

   let canvas = a_ref.querySelector("canvas");

   if (!canvas.getContext) return null;

   canvas.width = defaultWidth;
   canvas.height = defaultHeight;

   let ctx = canvas.getContext("2d");
   ctx.globalCompositeOperation = "lighter";

   return ctx;
}

function drawBioMorph(ctx, gene) {
   console.log("gene.Characteristics:" + gene.Characteristics);

   ctx.beginPath();
   ctx.translate(defaultWidth / 2, defaultHeight / 2);
   ctx.fillStyle = "#000000";
   ctx.strokeStyle = "#000000";
   ctx.arc(0, 0, 1, 0, Math.PI * 2, true);
   ctx.stroke();

   let base_gen = gene.Characteristics[GENERATIONS];
   if (base_gen <= 0) return;

   ctx.beginPath();
   drawIteration(
      gene.Characteristics[GENERATIONS],
      gene.Characteristics[STEM_LENGTH] + 3,
      Math.PI / 3,
      0,
      gene.Characteristics[BRANCH_COLOR]
   );
   ctx.stroke();

   console.log(ctx);

   function drawIteration(gen, len, base_rot, rot, col) {
      // console.log( "drawIteration: gen("+gen+"), len("+len+"), rot("+rot+")" )

      ctx.strokeStyle = RED_COLORS[col];
      ctx.save();
      ctx.rotate(rot);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, len);
      ctx.translate(0, len);

      if (--gen == 0) {
         // this should never go below 0...
         ctx.restore();
         return;
      }

      len = gene.updateStem(len);
      base_rot = gene.updateRotation(base_rot);
      col = gene.updateColor(col);

      drawIteration(gen, len, base_rot, 0 - base_rot, col);
      drawIteration(gen, len, base_rot, 0 + base_rot, col);

      ctx.restore();
   }
}
// vim set:et sw=3 ts=3
