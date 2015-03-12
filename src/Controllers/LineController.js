define(function(require,exports,module)
{
    var Connection = require('Model/Connection');
    var LineCanvas = require('Views/LineCanvas');
    var DynamicObjectController = require('Controllers/DynamicObjectController');

    function LineController(objectDef, state)
    {
        this.state = state || 'base';

        var line = this.makeLineView(objectDef);
        this.lineView = line;
        DynamicObjectController.call(this,objectDef,DynamicKnowledge.ModelLoader,line);

    }

    LineController.prototype = Object.create(DynamicObjectController.prototype);
    LineController.prototype.constructor = LineController;
    module.exports = LineController;


    LineController.prototype.makeLineView = function(objectDef)
    {
        var line = new LineCanvas();

        var lineEdges = objectDef.getRelationshipsOfType(Connection.Types.LineConnector);
        var fromEdge;
        var toEdge;

        for (var i=0;i<lineEdges.length;i++)
        {
            if (lineEdges[i].properties.get("direction") == "outgoing")
                fromEdge = lineEdges[i];
            else if (lineEdges[i].properties.get("direction") == "incoming")
                toEdge = lineEdges[i];
        }

        if (!(fromEdge && toEdge))
        {
            throw "Line does not have to/from edges defined";
        }

        var fromController = this.modelLoader.getObject(fromEdge.to);
        var toController = this.modelLoader.getObject(toEdge.to);

        line.setLineObjects(fromController.getView(),toController.getView());

        return line;
    };

});