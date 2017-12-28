const INTERATIONS = 0; // how many iterations of detail to add
const STEM_LENGTH = 1; // stem base length
const STEM_RATIO = 2; // stem length ratio from previous interation
const STEM_ABSOLUTE = 3; // stem length absolute difference from previous interation
const BRANCH_ANGLE = 4; // branch angle absolute difference from previous interation
const BRANCH_RATIO = 5; // branch angle ratio difference from previous interation
const BRANCH_OFFSET = 6; // offset of the branch from the end of the branch
const BRANCH_COLOR = 7; // stem color --> will be forced to be a positive number
const BRANCH_CJUMP = 8; // stem color jump offset

const RED_COLORS = [ "#000000", "#1A0000", "#330000", "#4D0000", "#660000", "#800000", "#990000", "#B30000", "#CC0000", "#E60000", "#FF0000", "#FF1A1A", "#FF3333", "#FF4D4D", "#FF6666", "#FF8080", "#FF9999", "#FFB3B3", "#FFCCCC", "#FFE6E6", "#FFFFFF", "#FFE6E6", "#FFCCCC", "#FFB3B3", "#FF9999", "#FF8080", "#FF6666", "#FF4D4D", "#FF3333", "#FF1A1A", "#FF0000", "#E60000", "#CC0000", "#B30000", "#990000", "#800000", "#660000", "#4D0000", "#330000", "#1A0000", "#000000" ];
var RED_LENGTH = RED_COLORS.length;

const DEFAULT_WIDTH = 250;
const DEFAULT_HEIGHT = 250;

class Genes {
   constructor(all_characteristics) {
      this.Characteristics = all_characteristics.slice();
   }

   reproduce(mutation) {
      var child = new Genes(this.Characteristics);
      child.Characteristics[mutation] += Genes.mutateNow();
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

   static mutateNow() { // slight bias towards positive numbers
      return Math.random() * 64 > 30 ? 1 : -1;
   }

   static generateFromString(description) {
      var newCharacteristics = [];
      if (description != "") {
         newCharacteristics = description.split("_").map(x => parseInt(x));
         if (newCharacteristics.length == 9) return new Genes(newCharacteristics);

         console.error("Wrong number of Characteristics in Gene");
         console.error("Gene Description: " + description);
         console.error("==> Found " + newCharacteristics.length + " Characteristics");
         console.error("...resorting to default");
      }

      return new Genes( [0, 0, 0, 0, 0, 0, 0, 0, 0] );
   }
}

function main() {
   let url = new URL(window.location.href);
   let results = url.searchParams.get("y");

   if (results) {
      let parentGene = Genes.generateFromString(decodeURIComponent(results));
      let ctx = setupContext("child_0", parentGene.toString(), 3);
      if (!ctx) return;

      drawBioMorph(ctx, parentGene);
      return;
   }

   results = url.searchParams.get("x");
   let parentGene = Genes.generateFromString(decodeURIComponent(results));

   var numCharacteristics = parentGene.Characteristics.length;
   for (let i = 0; i < numCharacteristics; ++i) {
      let child = parentGene.reproduce(i);
      let ctx = setupContext("child_" + i, child.toString(), 1);
      if (!ctx) return;

      drawBioMorph(ctx, child);
   }
}

function setupContext(id, description, factor) {
   let a_ref = document.getElementById(id);
   a_ref.href = "?x=" + description;

   let canvas = a_ref.querySelector("canvas");

   if (!canvas.getContext) return null;

   canvas.width = DEFAULT_WIDTH * factor;
   canvas.height = DEFAULT_HEIGHT * factor;

   let ctx = canvas.getContext("2d");
   ctx.globalCompositeOperation = "lighter";

   return ctx;
}

function drawBioMorph(ctx, gene) {
   console.log("gene.Characteristics:" + gene.Characteristics);

   ctx.beginPath();
   ctx.fillStyle = "#000000";
   ctx.strokeStyle = "#000000";
   ctx.arc(0, 0, 1, 0, Math.PI * 2, true);
   ctx.stroke();

   let totalIterations = gene.Characteristics[INTERATIONS];
   if (totalIterations <= 0) return; 

   // cache the angle, x, and y locations of each endpoint
   // important to note that each iteration uses double the cache of it's parent
   // this enables us to actually use the array to read and write at the same time
   // we read the parent entry from the mid of the array
   // and the child entry get's written to the end of the array
   // it is *very* important to always read first and write second
   let a_cache = new Array( 2 ** totalIterations );
   let x_cache = new Array( 2 ** totalIterations );
   let y_cache = new Array( 2 ** totalIterations );

   let pCache = 0; // parent cache location (retreival)
   let cCache = 1; // child cache location (storage)
   let szCache = 2; // size of the virtual cache
   let iter = 0;

   let stemLength = gene.Characteristics[STEM_LENGTH] + 3;
   let branchDelta = Math.PI / 3;
   let stemColor = gene.Characteristics[BRANCH_COLOR];

   a_cache[0] = 0.0;
   x_cache[0] = DEFAULT_WIDTH / 2;
   y_cache[0] = DEFAULT_HEIGHT / 2;

   // base iteration draws the original circle
   for( ;; ) {
      console.log( "Generation: " + iter );
      drawIteration();
      if( ++iter>=totalIterations ) break;

      stemLength = gene.updateStem(stemLength);
      branchDelta = gene.updateRotation(branchDelta);
      stemColor = gene.updateColor(stemColor);

      pCache = szCache - 1;  // set to midpoint of next cache size
      szCache *= 2;
      cCache = szCache -1;
   }

   return;

   function drawIteration() {
      // console.log( "drawIteration: gen("+gen+"), len("+len+"), rot("+rot+")" )
      let x0, y0;

      for( let branch=pCache; branch >= 0; --branch ) {
         console.log( "drawIteration: interation=" + iter + ", branch=" + branch )
         x0 = x_cache[ pCache ]
         y0 = y_cache[ pCache ]

         cAngle = a_cache[ pCache ] + branchDelta;
         // window.requestAnimationFrame( drawStem );
         drawStem();

         cAngle = a_cache[ pCache ] - branchDelta;
         // window.requestAnimationFrame( drawStem );
         drawStem();

         pCache -= 1;
      }
      return;

      function drawStem( timestamp ) {
         let x1 = x0 + stemLength * Math.cos( cAngle )
         let y1 = y0 + stemLength * Math.sin( cAngle )
         a_cache[ cCache ] = cAngle;

         console.log( "(x0,y0) to (x1,y1) = (" + x0 + "," + y0 + ") to (" + x1 + "," + y1 + ")" )

         ctx.beginPath();
         ctx.strokeStyle = RED_COLORS[stemColor];
         ctx.moveTo( x0, y0 );
         ctx.lineTo( x1, y1 );
         ctx.stroke();

         x_cache[ cCache ] = x1;
         y_cache[ cCache ] = y1;
         cCache -= 1;
      }
   }
}
// vim: set et sw=3 ts=3:
