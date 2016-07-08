/**
 * Code written by Florent Bouquet (contact@florentbouquet.com), under MIT license.
 *
 * Use the method drawTrophicNetwork (see doc below) to draw a trophic network for the
 * given trophic levels.
 * For example, the different trophic levels could represent, in the right order, birds,
 * predatory insects, hyperparasitoids, parasitoids, aphids and host plants.
 */
class TrophicNetworkDrawer {
  constructor() {
    this.canvas = null;
    this.ctx = null;

    // Default options
    this.options = {
      separatorWidth: 5,
      rectangleHeight: 30,
      spaceBetweenLevels: 150,
      defaultFillColor: "black",
      defaultTextColor: "white",
      canvasWidth: 500,
      font: "15px Arial"
    };
  }


  /**
   * Main function, to be called to draw the trophic network.
   * Validates the given parameters and uses them to draw the trophic network.
   *
   * To be valid,
   *  - the sum of each population array must be 1;
   *  - the sum of each row of the occupation matrices must be 1.
   *
   * Supported options are:
   *  - separatorWidth: 		the width separating two rectangles in pixels (default is 5);
   *  - rectangleHeight: 		the height of the rectangles in pixels (default is 30);
   *  - spaceBetweenLevels: the vertical space between two trophic levels in pixels (default is 150);
   *  - defaultFillColor:		the default fill color in case the colors for a trophic level are not set (default is black);
   *  - defaultTextColor:		the default text color in case the colors for a trophic level are not set (default is white);
   *  - canvasWidth: 		   	the width of the canvas for the whole trophic network (default is 500);
   *  - font: 							the font to be used for the species' labels (default is "15px Arial").
   *
   *
   * @param {Array<TrophicLevel>} trophicLevels Array of objects representing the trophic levels data.
   * @param {Object} options Drawing options (see supported options above).
   */
  drawTrophicNetwork(trophicLevels, options) {
    // Firstly, validate the mandatory values
    return this.validateTrophicLevels_(trophicLevels).then(() => {
      // Use the options passed
      this.options = Object.assign(this.options, options);
      // Draw the trophic network
      return this.draw_(trophicLevels);
    }).catch((error) => {
      alert(`Could not draw the trophic network with the given trophic levels data:\n${error}`);
      console.log(error);
    });
  }


  /**
   * Validates the provided trophic levels data (especially checking that the percentage sums are equal to 1).
   *
   * @param {Array<TrophicLevel>} trophicLevels Array of objects representing the trophic levels data.
   * @return {Promise} Promise resolving if the provided trophic levels are valid, rejecting
   *                           an error message otherwise.
   */
  validateTrophicLevels_(trophicLevels) {
    let errorMessage = "";
    return new Promise((resolve, reject) => {
      if (!trophicLevels || trophicLevels.length < 2) {
        errorMessage += "Please provide at least two trophic levels.";
      } else {
        trophicLevels.forEach((trophicLevel, trophicIndex) => {
          if (this.floatingNumberArraySum_(trophicLevel.populations) !== 1.0) {
            errorMessage += `- The sum of populations is not equal to 1 in the trophic ` +
              `level #${trophicIndex+1}.\n`;
          }

          if (trophicIndex > 0) {
            let previousTrophicLevel = trophicLevels[trophicIndex - 1];

            if (trophicLevel.occupationPerPreviousLevel.length !== trophicLevel.populations.length) {
              errorMessage += `- The number of rows in the matrix occupationPerPreviousLevel of the ` +
                `trophic level #${trophicIndex+1} should correspond to its number of populations.\n`;
            }

            trophicLevel.occupationPerPreviousLevel.forEach((occupationMatrixLine, occupationMatrixLineIndex) => {
              if (occupationMatrixLine.length !== previousTrophicLevel.populations.length) {
                errorMessage += `- The number of columns in the row #${occupationMatrixLineIndex+1} of ` +
									`the matrix occupationPerPreviousLevel of the trophic level #${trophicIndex+1} does not ` +
									`correspond to the number of populations given in the previous trophic level.\n`;
              }

              if (this.floatingNumberArraySum_(occupationMatrixLine) !== 1.0) {
                errorMessage += `- The total of the line #${occupationMatrixLineIndex+1} of the matrix ` +
                  `occupationPerPreviousLevel of the trophic level #${trophicIndex+1} is not equal to 1.`;
              }
            });
          }
        });
      }

      if (errorMessage.length > 0) {
        reject(errorMessage);
      } else {
        resolve();
      }
    });
  }


  /**
   * Draws the trophic network in the canvas element (called from drawTrophicNetwork once the parameters are set).
   * Do not call this function  directly.
   *
   * @param {Array<TrophicLevel>} trophicLevels Array of objects representing the trophic levels data.
   * @return {Promise} Promise resolving if the trophic network was successfully drawn.
   */
  draw_(trophicLevels) {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.canvas.width = this.options.canvasWidth;
    // Compute canvas height
    this.ctx.canvas.height = trophicLevels.length * this.options.rectangleHeight +
        (trophicLevels.length - 1) * this.options.spaceBetweenLevels;

    // Start index for the rectangle label if not using custom labels
    this.currentRectangleIndex = 1;

    let trophicRectanglesPromises = trophicLevels.map((trophicLevel, trophicIndex) => {
      return this.drawTrophicLevelRectangles_(trophicLevel, trophicIndex);
    });

    return Promise.all(trophicRectanglesPromises).then(() => {
      let trophicTrianglesPromises = trophicLevels.map((trophicLevel, trophicIndex) => {
        if (trophicIndex > 0) {
          return this.drawTrianglesBetween_(trophicLevel, trophicLevels[trophicIndex - 1]);
        } else {
          return Promise.resolve();
        }
      });

      return Promise.all(trophicTrianglesPromises);
    });
  }


  /**
   * Draws the rectangles for a trophic level to represent the population and adds the
   * rectangle coordinates in the given trophic level object.
   *
   * @param {TrophicLevel} trophicLevel Object representing the trophic level's data.
   * @param {number} trophicIndex Index of the given trophic level.
   * @return {Promise} Promise resolving if the rectangles were successfully drawn for the trophic level.
   */
  drawTrophicLevelRectangles_(trophicLevel, trophicIndex) {
    var previousCumulatedPopPercent = 0.0;
    // This represents the rectangle coordinates
    var rectangleCoords = [];
    let yPos = trophicIndex * (this.options.rectangleHeight + this.options.spaceBetweenLevels);

    trophicLevel.populations.forEach((specyPopPercent, specyIndex) => {
      // Compute the rectangle coordinates
      let leftPos = previousCumulatedPopPercent * this.options.canvasWidth;
      let width = specyPopPercent * this.options.canvasWidth;
      if (specyIndex > 0) {
        leftPos += this.options.separatorWidth;
        width -= this.options.separatorWidth;
      }

      // Determine the color
      let specyColorObj;
      if (trophicLevel.colors) {
        specyColorObj = trophicLevel.colors[specyIndex % trophicLevel.colors.length];
      }
      this.ctx.fillStyle = (specyColorObj) ? specyColorObj.fill : this.options.defaultFillColor;

      // Draw the rectangle
      this.ctx.fillRect(leftPos, yPos, width, this.options.rectangleHeight);

      // Set the label style and content
      this.ctx.font = this.options.font;
      this.ctx.fillStyle = (specyColorObj) ? specyColorObj.text : this.options.defaultTextColor;
      let label;
      if (trophicLevel.labels && trophicLevel.labels[specyIndex]) {
        label = trophicLevel.labels[specyIndex];
      } else {
        label = this.currentRectangleIndex.toString();
      }
      this.currentRectangleIndex++;

      // Compute the label position
      var labelPosX = leftPos + width/2 - label.length*4;
      var labelPosY = yPos + this.options.rectangleHeight - 10;
      // Draw the label
      this.ctx.fillText(label, labelPosX, labelPosY);

      // Update cumulated population percentage to position the next rectangle
      previousCumulatedPopPercent += specyPopPercent;

      // Add rectangle coords for this specy
      rectangleCoords.push({
        topLeftPoint: [leftPos, yPos],
        bottomLeftPoint: [leftPos, yPos + this.options.rectangleHeight],
        width: width
      });
    });

    // Add the rectangle coords to the trophic level object
    trophicLevel.rectangleCoords = rectangleCoords;

    return Promise.resolve();
  }


  /**
   * Draws the triangles to the given trophic level from the given previous level.
   *
   * @param {TrophicLevel} preyTrophicLevel Object representing the prey trophic level's data (with rectangle coords in it).
   * @param {TrophicLevel} previousTrophicLevel Object representing the predator trophic level's data (with rectangle coords in it).
   * @return {Promise} Promise resolving if the triangles were successfully drawn for the trophic level.
   */
  drawTrianglesBetween_(preyTrophicLevel, predatorTrophicLevel) {
    preyTrophicLevel.occupationPerPreviousLevel.forEach((occupationOfCurrentPrey, preyIndex) => {
      // For each prey
      let leftTriangleOffsetX = 0;
      let currentPreyRectangleCoords = preyTrophicLevel.rectangleCoords[preyIndex];
      occupationOfCurrentPrey.forEach((currentOccupationPercent, predatorIndex) => {
        // Retrieve the triangle origin for the current predator
        let currentPredatorRectangleCoords = predatorTrophicLevel.rectangleCoords[predatorIndex],
            currentPredatorTriangleOrigin = [
              currentPredatorRectangleCoords.bottomLeftPoint[0] + currentPredatorRectangleCoords.width / 2,
              currentPredatorRectangleCoords.bottomLeftPoint[1]
            ];

        // Compute the triangle vertices
        let leftPreyVertex = currentPreyRectangleCoords.topLeftPoint;
        let leftTriangleVertex = [leftPreyVertex[0] + leftTriangleOffsetX,
                      leftPreyVertex[1]];
        let rightTriangleVertex = [leftTriangleVertex[0] + currentPreyRectangleCoords.width * currentOccupationPercent,
                       leftTriangleVertex[1]];

        // Determine the color
        let triangleColor;
         if (predatorTrophicLevel.colors) {
           triangleColor = predatorTrophicLevel.colors[predatorIndex % predatorTrophicLevel.colors.length].fill;
         }
        if (!triangleColor) {
           triangleColor = this.options.defaultFillColor;
         }

        // Draw the triangle
        this.drawTriangle_(leftTriangleVertex, rightTriangleVertex, currentPredatorTriangleOrigin, triangleColor);

        // Compute the left X offset on the prey rectangle for the next triangle
        leftTriangleOffsetX += rightTriangleVertex[0] - leftTriangleVertex[0];
      });
    });
  }


  /**
   * Draws a triangle with the three given vertices with the given fill style.
   *
   * @param {Point} vertexA First vertex of the triangle.
   * @param {Point} vertexB Second vertex of the triangle.
   * @param {Point} vertexC Third vertex of the triangle.
   * @param {string} fillStyle The fill style of the triangle (usually a color).
   */
  drawTriangle_(vertexA, vertexB, vertexC, fillStyle) {
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
   * Utility function to compute the sum of an array of floating numbers.
   *
   * @param {Array<number>} array The array of floating numbers.
   * @return {number} The sum of the array (rounded to two decimals).
   */
  floatingNumberArraySum_(array) {
    var sum = 0;
    array.forEach((value) => {
      sum += value;
    });
    // Round the sum to two decimals to avoid floating precision problems
    return Math.round(sum * 100) / 100;
  }
}
