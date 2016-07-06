/**
 * Code written by Florent Bouquet (contact@florentbouquet.com), under MIT license.
 *
 * Use the function trophicNetworkDrawer.drawTrophicNetwork (see doc below) to draw
 * a trophic network with given prey species, predator species and eventually
 * another type of predator species.
 * For example, preys could be aphids, predators could be parasitoids, and
 * other predators could be hyper parasitoids.
 */
class TrophicNetworkDrawer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.predatorsPop = [];
    this.preysPop = [];
    this.otherPredatorsPop = [];
    this.occupationPreysPerPredators = [];
    this.occupationPreysPerOtherPredators = [];
    this.predatorsTriangleOrigin = []; // Computed triangles origin for predators
    this.otherPredatorsTriangleOrigin = []; // Computed triangles origin for other predators
    this.preysCoords = []; // Computed preys coordinates

    // Default options
    this.options = {
      separatorWidth: 5,
      rectangleHeight: 30,
      predatorsPosY: 0,
      preysPosY: 150,
      otherPredatorsPosY: 300,
      canvasWidth: 500,
      predatorsColors: [["rgba(200,0,0,0.5)", "black"], ["rgba(0,200,0,0.5)", "black"], ["rgba(0,0,200,0.5)", "black"]],
      preysColors: [["black", "white"]],
      otherPredatorsColors: [["rgba(126,33,150,0.5)", "black"], ["rgba(255,85,0,0.5)", "black"], ["rgba(255,3,199,0.5)", "black"], ["rgba(107,28,0,0.5)", "black"]],
      predatorsLabels: null,
      preysLabels: null,
      otherPredatorsLabels: null,
      font: "15px Arial"
    };
  }


  /**
   * Main function, to be called to draw the trophic network.
   * Validates the given parameters and uses them to draw the trophic network.
   *
   * To be valid,
   *  - each population array sum must be 1;
   *  - for each row index, the sum of the row in the predator to prey occupations matrix plus the one of
   * 		the row in the other predator to prey occupations matrix must be 1
   * 		(e.g. the sum of the first row of occupationPreysPerPredators plus the sum of the first row of
       occupationPreysPerOtherPredators must be equal to 1).
   *
   * Supported options are:
   *  - separatorWidth: 		the width separating two rectangles in pixels (default is 5);
   *  - rectangleHeight: 		the height of the rectangles in pixels (default is 30);
   *  - predatorsPosY: 		the Y position of the predators' line in pixels (default is 0);
   *  - preysPosY: 			the Y position of the preys' line in pixels (default is 150);
   *  - otherPredatorsPosY: 	the Y position of the other predators' line in pixels (default is 300);
   *  - canvasWidth: 			the width of the canvas for the whole trophic network (default is 500);
   *  - predatorsColors: 		an array of colors for the predators, each element is an array of two colors:
   *								the first one is the main color (for rectangles and triangles),
   *								the second one is the color of the text label
   *								if there is not enough colors for the number of predator species, goes back to the array beginning
   * 									to determine the color to be used
   *								each color can be a known color string (e.g. "black"), a RGB color or even a
   *									RGBA color to indroduce transparency (e.g. "rgba(126,33,150,0.5)"
   * 									where the components are red,green,blue,transparency)
   * 								to pick up a color and get RGB components, you could use some utility software
   * 									like "La Boite à Couleurs" (http://www.clubic.com/telecharger-fiche18543-la-boite-a-couleurs.html)
   *								(default value is [["rgba(200,0,0,0.5)", "black"], ["rgba(0,200,0,0.5)", "black"], ["rgba(0,0,200,0.5)", "black"]])
   *  - preysColors: 			an array of colors for the preys, each element is an array of two colors (see explanations for predatorsColors)
   *								(default value is [["black", "white"]])
   *  - otherPredatorsColors: an array of colors for the other predators, each element is an array of two colors (see explanations for predatorsColors)
   *								(default value is [["rgba(126,33,150,0.5)", "black"], ["rgba(255,85,0,0.5)", "black"], ["rgba(255,3,199,0.5)", "black"], ["rgba(107,28,0,0.5)", "black"]])
   *  - predatorsLabels: 		an array of labels for the predators (to be drawn in the corresponding rectangles)
   *								(default value is null, drawing the indexes instead)
                   example: ["pred1", "pred2", "pred3"]
   *  - preysLabels: 			an array of labels for the preys (to be drawn in the corresponding rectangles)
   *								(default value is null, drawing the indexes instead)
                   example: ["prey1", "prey2", "prey3", "prey4"]
   *  - otherPredatorsLabels: an array of labels for the other predators (to be drawn in the corresponding rectangles)
   *								(default value is null, drawing the indexes instead).
                   example: ["opred1", "opred2"]
   *  - font: 				the font to be used for the species' labels (default is "15px Arial").
   *
   *
   * @param {Array<number>} predatorsPop Population percentage array of the predators (the sum must be 1).
   * @param {Array<number>} preysPop Population percentage array of the preys (the sum must be 1).
   * @param {Array<number>} otherPredatorsPop Population percentage array of the other predators (the sum must be 1).
   * @param {Array<Array<number>>} occupationPreysPerPredators Matrix of occupations from predators to preys with percentages.
   * @param {Array<Array<number>>} occupationPreysPerOtherPredators Matrix of occupations from other predators to preys with percentages.
   * @param {Object} options Drawing options (see supported options above).
   */
  drawTrophicNetwork(predatorsPop, preysPop, otherPredatorsPop,
                     occupationPreysPerPredators, occupationPreysPerOtherPredators,
                     options) {
    // Firstly, validate the mandatory values
    var paramsAreValid = this.validateMandatoryValues(predatorsPop, preysPop, otherPredatorsPop,
                occupationPreysPerPredators, occupationPreysPerOtherPredators);
    if (!paramsAreValid) { return; }

    // The mandatory values are correct: use them
    this.predatorsPop = predatorsPop;
    this.preysPop = preysPop;
    this.otherPredatorsPop = otherPredatorsPop;
    this.occupationPreysPerPredators = occupationPreysPerPredators;
    this.occupationPreysPerOtherPredators = occupationPreysPerOtherPredators;

    // Then, update optional values with the provided one
    this.options = Object.assign(this.options, options);

    // Finally, draw the trophic network
    this.draw();
  }


  /**
   * Validates the parameters passed, checking that the percentage sums are equal to 1.
   *
   * @param {Array<number>} predatorsPop Population percentage array of the predators (the sum must be 1).
   * @param {Array<number>} preysPop Population percentage array of the preys (the sum must be 1).
   * @param {Array<number>} otherPredatorsPop Population percentage array of the other predators (the sum must be 1).
   * @param {Array<Array<number>>} occupationPreysPerPredators Matrix of occupations from predators to preys with percentages.
   * @param {Array<Array<number>>} occupationPreysPerOtherPredators Matrix of occupations from other predators to preys with percentages.
   * @return {boolean} true if the parameters are valid.
   */
  validateMandatoryValues(predatorsPop, preysPop, otherPredatorsPop,
                          occupationPreysPerPredators, occupationPreysPerOtherPredators) {
    var paramsAreValid = true;

    if (this.arraySum(predatorsPop) !== 1.0) {
      alert("The sum of predator populations must be equal to 1.");
      paramsAreValid = false;
    }
    if (this.arraySum(preysPop) !== 1.0) {
      alert("The sum of preys populations must be equal to 1.");
      paramsAreValid = false;
    }
    if (otherPredatorsPop.length > 0 && this.arraySum(otherPredatorsPop) !== 1.0) {
      alert("The sum of other predator populations must be equal to 1.");
      paramsAreValid = false;
    }
    if (occupationPreysPerPredators.length !== preysPop.length) {
      alert("The predator occupations of preys must be set for every preys.");
      paramsAreValid = false;
    }
    if (otherPredatorsPop.length > 0 && occupationPreysPerOtherPredators.length !== preysPop.length) {
      alert("The other predator occupations of preys must be set for every preys.");
      paramsAreValid = false;
    }
    if (occupationPreysPerPredators[0].length !== predatorsPop.length) {
      alert("The predator occupations of preys must be set for every predators.");
      paramsAreValid = false;
    }
    if (otherPredatorsPop.length > 0 && occupationPreysPerOtherPredators[0].length !== otherPredatorsPop.length) {
      alert("The other predator occupations of preys must be set for every other predators.");
      paramsAreValid = false;
    }
    occupationPreysPerPredators.forEach((occupationPreyPerPredators, preyIndex) => {
      if (this.arraySum(occupationPreysPerPredators[preyIndex]) + this.arraySum(occupationPreysPerOtherPredators[preyIndex]) !== 1.0) {
        var preyIndexShown = preyIndex+1;
        alert("The sum of occupations of a prey by predators plus other predators must be equal to 1 (prey index "+ preyIndexShown +").");
        paramsAreValid = false;
      }
    });

    return paramsAreValid;
  }


  /**
   * Draws the trophic network in the canvas element (called from drawTrophicNetwork once the parameters are set).
   * Do not call this function  directly.
   */
  draw() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.canvas.width = this.options.canvasWidth;
    // Compute canvas height
    var lastRectangleRowY = (this.otherPredatorsPop.length > 0) ? this.options.otherPredatorsPosY : this.options.preysPosY;
    this.ctx.canvas.height = lastRectangleRowY + this.options.rectangleHeight;

    // Start index for the rectangle label if not using custom labels
    var startIndex = 1;

    // Draw predators' rectangles and get their triangle origins
    this.predatorsTriangleOrigin = this.drawSpecyRectangles(this.predatorsPop, this.options.predatorsPosY,
                                 this.options.predatorsColors, this.options.predatorsLabels,
                                 startIndex, true, true);
    // Draw preys' rectangles and get the rectangles' coords
    startIndex += this.predatorsPop.length;
    this.preysCoords = this.drawSpecyRectangles(this.preysPop, this.options.preysPosY, this.options.preysColors,
                          this.options.preysLabels, startIndex, false);

    // Draw other predators' rectangles and get their triangle origins
    startIndex += this.preysPop.length;
    this.otherPredatorsTriangleOrigin = this.drawSpecyRectangles(this.otherPredatorsPop, this.options.otherPredatorsPosY,
                                    this.options.otherPredatorsColors, this.options.otherPredatorsLabels,
                                    startIndex, true);

    // Draw the triangles from predators to preys
    this.drawPredatorsToPreysTriangles(this.occupationPreysPerPredators, this.predatorsTriangleOrigin, this.options.predatorsColors);

    // Draw the triangles from other predators to preys
    this.drawPredatorsToPreysTriangles(this.occupationPreysPerOtherPredators, this.otherPredatorsTriangleOrigin,
                      this.options.otherPredatorsColors, true);
  }


  /**
   * Draws a specy's rectangles to represent the population.
   *
   * @param {Array<number>} specyPopArray Population array of the specy.
   * @param {number} specyPosY Y position for the specy, in pixels.
   * @param {Array<TwoColors>} specyColors Colors for the specy, where each TwoColors is like [mainColorString, textColorString].
   * @param {Array<string>} labels Array of string labels to be drawn in the rectangles.
   * @param {number} startIndex Start index for the label if labels parameter is null.
   * @param {boolean} returnTriangleOriginCoords true to return an array of triangle origins, false to return other useful rectangle coords.
   * @param {boolean} opt_triangleOriginIsOnBottom Optional, true if the triangle origin is on the bottom of the rectangle, useful only if returnTriangleOriginCoords is true.
   * @return {Array<Point>|Array<{topLeftPoint:Point, bottomLeftPoint:Point, width:number}>} Array of triangle origins or rectangle coords for the specy, where Point is like [xPosNumber, yPosNumber].
   */
  drawSpecyRectangles(specyPopArray, specyPosY, specyColors, labels, startIndex,
                      returnTriangleOriginCoords, opt_triangleOriginIsOnBottom) {
    var previousCumulatedPopPercent = 0.0;
    // This represents the triangle origins for predators and the useful coords for preys
    var specyCoords = [];
    specyPopArray.forEach((specyPopPercent, specyIndex) => {
      // Compute the rectangle coordinates
      var leftPos = previousCumulatedPopPercent * this.options.canvasWidth + this.options.separatorWidth;
      var width = specyPopPercent * this.options.canvasWidth - this.options.separatorWidth;

      // Draw the rectangle
      this.ctx.fillStyle = this.getColorFromArray(specyColors, specyIndex);
      this.ctx.fillRect(leftPos, specyPosY, width, this.options.rectangleHeight);

      // Set the label style and content
      this.ctx.font = this.options.font;
      this.ctx.fillStyle = this.getColorFromArray(specyColors, specyIndex, true);
      var label;
      if (labels !== null) {
        // Custom labels are set: use them
        label = labels[specyIndex];
      } else {
        // Else, use the index for the label
        label = startIndex + specyIndex;
        label = label.toString();
      }
      // Compute the label position
      var labelPosX = leftPos + width/2 - label.length*4;
      var labelPosY = specyPosY + this.options.rectangleHeight - 10;
      // Draw the label
      this.ctx.fillText(label, labelPosX, labelPosY);

      // Update cumulated population percentage to position the next rectangle
      previousCumulatedPopPercent += specyPopPercent;

      // Add triangle origin for this specy
      if (returnTriangleOriginCoords) {
        var triangleOriginY = (opt_triangleOriginIsOnBottom) ? specyPosY + this.options.rectangleHeight : specyPosY;
        specyCoords.push([leftPos + width/2, triangleOriginY]);
      } else {
        specyCoords.push({
                  topLeftPoint: [leftPos, specyPosY],
                   bottomLeftPoint: [leftPos, specyPosY + this.options.rectangleHeight],
                   width: width
        });
      }
    });

    return specyCoords;
  }


  /**
   * Draws the triangles from a type of predators ("predators" or "other predators") to the preys.
   *
   * @param {Array<Array<number>>} occupationPreysPerPredatorsMatrix Matrix of predator to prey occupations (the rows are the preys, the columns are the predators).
   * @param {Array<Point>} predatorsTriangleOrigins Array of triangle origins for the predators.
   * @param {Array<TwoColors>} predatorsColors Colors for the predator specy, where each TwoColors is like [mainColorString, textColorString].
   * @param {boolean} opt_toPreyRectangleBottom true if each triangle's target is the bottom of the prey's rectangle.
   */
  drawPredatorsToPreysTriangles(occupationPreysPerPredatorsMatrix, predatorsTriangleOrigins,
                                predatorsColors, opt_toPreyRectangleBottom) {
    occupationPreysPerPredatorsMatrix.forEach((occupationPredatorForCurrentPrey, preyIndex) => {
      // For each prey
      var leftTriangleOffsetX = 0;
      // Retrieve the current prey's coords
      var currentPreyCoords = this.preysCoords[preyIndex];
      occupationPredatorForCurrentPrey.forEach((currentOccupationPercent, predatorIndex) => {
        // For each predator
        // Compute the triangle vertices
        var currentPredatorTriangleOrigin = predatorsTriangleOrigins[predatorIndex];
        var leftPreyVertex = (opt_toPreyRectangleBottom) ? currentPreyCoords.bottomLeftPoint : currentPreyCoords.topLeftPoint;
        var leftTriangleVertex = [leftPreyVertex[0] + leftTriangleOffsetX,
                      leftPreyVertex[1]];
        var rightTriangleVertex = [leftTriangleVertex[0] + currentPreyCoords.width * currentOccupationPercent,
                       leftTriangleVertex[1]];
        var fillStyle = this.getColorFromArray(predatorsColors, predatorIndex);

        // Draw the triangle
        this.drawTriangle(leftTriangleVertex, rightTriangleVertex, currentPredatorTriangleOrigin, fillStyle);

        // Compute the left X offset on the prey rectangle for the next triangle
        leftTriangleOffsetX += rightTriangleVertex[0] - leftTriangleVertex[0];
      });
    });
  }


  /**
   * Gets the color corresponding to the index in the given array. Uses modulo function if the array is not big enough.
   *
   * @param {Array<TwoColors>} colors Colors array, where each TwoColors is like [mainColorString, textColorString].
   * @param {number} index Index of the color to retrieve.
   * @param {boolean} opt_forText true if the color to get is the text color, false to get the main color.
   */
  getColorFromArray(colors, index, opt_forText) {
    var typeOfColorIndex = (opt_forText) ? 1 : 0;
    return colors[index % colors.length][typeOfColorIndex];
  }

  /**
   * Draws a triangle with the three given vertices with the given fill style.
   *
   * @param {Point} vertexA First vertex of the triangle.
   * @param {Point} vertexB Second vertex of the triangle.
   * @param {Point} vertexC Third vertex of the triangle.
   * @param {string} fillStyle The fill style of the triangle (usually a color).
   */
  drawTriangle(vertexA, vertexB, vertexC, fillStyle) {
    this.ctx.fillStyle = fillStyle;
    this.ctx.globalAlpha = 1.0;
    this.ctx.beginPath();
    this.ctx.moveTo(vertexA[0], vertexA[1]);
    this.ctx.lineTo(vertexC[0], vertexC[1]);
    this.ctx.lineTo(vertexB[0], vertexB[1]);
    this.ctx.lineTo(vertexA[0], vertexA[1]);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Utility function to compute the sum of a number array.
   *
   * @param {Array<number>} array The array of numbers.
   * @return {number} The sum of the array.
   */
  arraySum(array) {
    var sum = 0;
    array.forEach((value) => {
      sum += value;
    });
    // Round the sum to two decimals to avoid floating precision problems
    return Math.round(sum * 100) / 100;
  }
}
