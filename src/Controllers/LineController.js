define(function(require,exports,module)
{
    var Connection = require('Model/Connection');
    var LineCanvas = require('Views/LineCanvas');
    var DynamicObjectController = require('Controllers/DynamicObjectController');

    function LineController(options)
    {
        this.state = options.state || 'base';

        var line = this.makeLineView(options.objectDef);
        this.lineView = line;
        DynamicObjectController.call(this,{objectDef:options.objectDef,view:line});

    }

    LineController.prototype = Object.create(DynamicObjectController.prototype);
    LineController.prototype.constructor = LineController;
    module.exports = LineController;


    LineController.prototype.makeLineView = function(objectDef)
    {
        var line = new LineCanvas();

        var lineEdges = objectDef.getRelationshipsOfType(Connection.Types.LineVertex);
        var fromEdge;
        var toEdge;

        for (var i=0;i<lineEdges.length;i++)
        {
            var edge = lineEdges[i];
            console.debug("Edge direction = " + edge.properties.get("direction"));

            if (lineEdges[i].properties.get("direction") == "outgoing")
                fromEdge = lineEdges[i];
            else if (lineEdges[i].properties.get("direction") == "incoming")
                toEdge = lineEdges[i];
        }

        if (!(fromEdge && toEdge))
        {
            throw "Line does not have to/from edges defined";
        }

        var fromController = DynamicKnowledge.ModelLoader.getObject(fromEdge.to);
        var toController = DynamicKnowledge.ModelLoader.getObject(toEdge.to);

        line.setLineObjects(fromController.getView(),toController.getView());

        return line;
    };


    LineController.prototype.attachToParent = function(parentController)
    {
        console.debug("Showing line");
        parentController.getView().add(this.lineView.getModifier()).add(this.lineView.getRenderController());
        this.lineView.parent = parentController.getView();
        this.lineView.update();
    };

});