const ITERATIONS = 0; // how many iterations of detail to add
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
   constructor(allTraits) {
      this.Traits = allTraits.slice();
      if( this.Traits[ITERATIONS] < 0 ) this.Traits[ITERATIONS] = 1;
   }

   reproduce(mutation) {
      var child = new Genes(this.Traits);
      child.Traits[mutation] += Genes.mutateNow();
      return child;
   }

   updateStem(length) {
      length += this.Traits[STEM_ABSOLUTE];
      length *= 1 + this.Traits[STEM_RATIO] / 10;
      return length;
   }

   updateRotation(rotation) {
      rotation += this.Traits[BRANCH_ANGLE] / 100;
      rotation *= 1 + this.Traits[BRANCH_RATIO] / 100;
      return rotation;
   }

   updateOffset(offset) {
      offset += this.Traits[BRANCH_OFFSET];
      return offset;
   }

   updateColor(color) {
      color += this.Traits[BRANCH_CJUMP];
      if (color < 0) color += RED_LENGTH;
      if (color >= RED_LENGTH) color %= RED_LENGTH;
      return color;
   }

   toString() {
      return this.Traits.join("_");
   }

   static mutateNow() { // slight bias towards positive numbers
      return Math.random() * 64 > 30 ? 1 : -1;
   }

   static generateFromString(description) {
      var newCharacteristics = [];
      if (description != "") {
         newCharacteristics = description.split("_").map(x => parseInt(x));
         if (newCharacteristics.length == 9) return new Genes(newCharacteristics);

         console.error("Wrong number of Traits in Gene");
         console.error("Gene Description: " + description);
         console.error("==> Found " + newCharacteristics.length + " Traits");
         console.error("...resorting to default");
      }

      return new Genes( [0, 0, 0, 0, 0, 0, 0, 0, 0] );
   }
}

function main() {
   let url = new URL(window.location.href);
   if( drawZoom( url )) return;

   let results = url.searchParams.get("x");
   let parentGene = Genes.generateFromString(decodeURIComponent(results));

   var numCharacteristics = parentGene.Traits.length;
   for (let i = 0; i < numCharacteristics; ++i) {
      let bar = document.getElementById("child_"+i+"_bar");
      let child = parentGene.reproduce(i);
      let ctx = setupContext("child_" + i, child.toString(), 1);
      if (!ctx) return;

      drawBioMorph( ctx, child, bar );
   }
}

function drawBioMorph( ctx, gene, bar ) {
   let totalIterations = gene.Traits[ITERATIONS];
   let totalTicks = 2 ** (totalIterations) - 1;
   let tickIncrement = 100 / totalTicks;
   let tick = 0.0;

   window.requestAnimationFrame( 
      iterationGenerator( 
         totalIterations,              /* total number of iterations */
         ctx.canvas.width / 2,         /* initial x position */
         ctx.canvas.height / 2,        /* initial y position */
         gene.Traits[STEM_LENGTH] + 3, /* initial stem length */
         Math.PI / 5,                  /* initial angle/orientation of the BioMorph */
         Math.PI / 3,                  /* initial angle of seperation from the main stem for the branches */
         gene.Traits[BRANCH_OFFSET],
         gene.Traits[BRANCH_COLOR]     /* initial color (offset into the color array) */
      ));

   /* using ctx and gene as locally global variables */
   function iterationGenerator( iter, x0, y0, stemLength, branchAngle, branchDelta, branchOffset, stemColor ) {
      return( function ( timeStamp ) {
         // console.log( "iterationGenerator: iter="+iter+", x="+x0+",y="+y0+", col="+stemColor );
         branchAngle += branchDelta;
         let x1 = x0 + stemLength * Math.cos( branchAngle )
         let y1 = y0 + stemLength * Math.sin( branchAngle )

         ctx.strokeStyle = RED_COLORS[stemColor];
         ctx.beginPath();
         ctx.moveTo( x0, y0 );
         ctx.lineTo( x1, y1 );
         ctx.stroke();

         tick += tickIncrement;
         bar.style.width = Math.round( tick ) + "%";
         if( --iter <= 0 ) return;

         stemLength = gene.updateStem(stemLength);
         branchDelta = gene.updateRotation(branchDelta);
         branchOffset = gene.updateOffset(branchOffset);
         stemColor = gene.updateColor(stemColor);

         // window.requestAnimationFrame( iterationGenerator( iter, x1, y1, stemLength, branchAngle, 0 - branchDelta, branchOffset, stemColor ));
         // window.requestAnimationFrame( iterationGenerator( iter, x1, y1, stemLength, branchAngle, 0 + branchDelta, branchOffset, stemColor ));
         setTimeout( iterationGenerator( iter, x1, y1, stemLength, branchAngle, 0 - branchDelta, branchOffset, stemColor ), 5 );
         setTimeout( iterationGenerator( iter, x1, y1, stemLength, branchAngle, 0 + branchDelta, branchOffset, stemColor ), 5 );
      });
   }
}

function setupContext(id, description, factor) {
   document.getElementById(id+"_exp").href = "?y=" + description;

   let a_ref = document.getElementById(id);
   a_ref.href = "?x=" + description;

   let canvas = a_ref.querySelector("canvas");

   if (!canvas.getContext) return null;

   canvas.width = DEFAULT_WIDTH * factor;
   canvas.height = DEFAULT_HEIGHT * factor;

   let ctx = canvas.getContext("2d");
   ctx.globalCompositeOperation = 'destination-over';

   return ctx;
}

function drawZoom( url ) {
   let results = url.searchParams.get("y");

   if (results) {
      let bar = document.getElementById("child_0_bar");
      let gene = Genes.generateFromString(decodeURIComponent(results));
      let ctx = setupContext("child_0", gene.toString(), 3);
      if (!ctx) return true;

      document.getElementById( "child_0_exp" ).style.display = "none";
      let divs = document.getElementsByClassName( "alt" );
      for( let d=0; d<divs.length; ++d ) 
         divs[d].style.display = "none";

      drawBioMorph( ctx, gene, bar );
      return true;
   }

   return false;
}
// vim: set et sw=3 ts=3:
