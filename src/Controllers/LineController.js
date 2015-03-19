define(function(require,exports,module)
{
    var Connection = require('Model/Connection');
    var ConnectingLine = require('Views/ConnectingLine');
    var DynamicObjectController = require('Controllers/DynamicObjectController');
    var ConnectingLineAnchor = require('Views/ConnectingLineAnchor');
    var EditorFactory = require('Editors/EditorFactory');
    var BoxView = require('PositioningLayouts/BoxView');
    var Vector = require('ProperVector');
    var Colors = require('Colors');
    var MouseSync = require('famous/inputs/MouseSync');
    var Utils = require('Utils');

    function LineController(options)
    {
        this.state = options.state || 'base';

        var line = this.makeLineView(options.objectDef);
        this.lineView = line;
        DynamicObjectController.call(this,{objectDef:options.objectDef,view:line});
        this.options.allowedModes = {"edit":true};

    }

    LineController.prototype = Object.create(DynamicObjectController.prototype);
    LineController.prototype.constructor = LineController;
    module.exports = LineController;



    LineController.prototype.createEditRules = function()
    {
        return ["delete","adjustLine"];
    };

    LineController.prototype.makeLineView = function(objectDef)
    {
        var line = new ConnectingLine();

        var lineEdges = objectDef.getRelationshipsOfType(Connection.Types.LineVertex);
        var fromEdge;
        var toEdge;

        for (var i=0;i<lineEdges.length;i++)
        {
            var edge = lineEdges[i];

            if (lineEdges[i].properties.get("direction") == "outgoing")
                fromEdge = lineEdges[i];
            else if (lineEdges[i].properties.get("direction") == "incoming")
                toEdge = lineEdges[i];
        }

        if (!(fromEdge && toEdge))
        {
            throw "Line does not have to/from edges defined";
        }

        console.debug("Line: '" + fromEdge.to + "' -> '" + toEdge.to + "'");

        var fromView = DynamicKnowledge.ModelLoader.getObject(fromEdge.to).getView();
        var toView   = DynamicKnowledge.ModelLoader.getObject(toEdge.to).getView();

        var fromAnchor = new ConnectingLineAnchor();
        fromAnchor.applyProperties(Utils.getPropertyMap(fromEdge.properties));
        var toAnchor = new ConnectingLineAnchor();
        toAnchor.applyProperties(Utils.getPropertyMap(toEdge.properties));

        fromAnchor.parent = fromView;
        toAnchor.parent = toView;

        fromView.add(fromAnchor.getModifier()).add(fromAnchor.getRenderController());
        toView.add(toAnchor.getModifier()).add(toAnchor.getRenderController());

        fromView.on('layout',function(){
            line.update();
        });

        toView.on('layout',function(){
            line.update();
        });

        line.setLineObjects(fromAnchor,toAnchor);

        this._fromAnchor = fromAnchor;
        this._toAnchor = toAnchor;
        this._fromEdge = fromEdge;
        this._toEdge = toEdge;

        return line;
    };

    LineController.prototype.makeEditor = function(editorName)
    {
        switch (editorName)
        {
            case "adjustLine":
                return _makeLineAdjustor.call(this);
            default:
                return DynamicObjectController.prototype.makeEditor.call(this,editorName);
        }
    };

    LineController.prototype.attachToParent = function(parentController)
    {
        console.debug("Showing line");
        parentController.getView().add(this.lineView.getModifier()).add(this.lineView.getRenderController());
        this.lineView.parent = parentController.getView();
        this.lineView.update();
    };


    function _makeLineAdjustor()
    {
        var fromAnchor = this._fromAnchor;
        var toAnchor = this._toAnchor;
        var fromEdge = this._fromEdge;
        var toEdge = this._toEdge;

        return {

            createUI: function()
            {
                this.hide();
                this._adjustors = [];

                function adjustCallback(edge, newAlign)
                {
                    edge.properties.set("align",newAlign);
                }

                this._adjustors.push(_makeConnectorAdjustor(fromAnchor,adjustCallback.bind(this,fromEdge)));
                this._adjustors.push(_makeConnectorAdjustor(toAnchor,adjustCallback.bind(this,toEdge)));

            },

            hide: function()
            {
                if (!this._adjustors)
                    return;

                for (var i=0;i<this._adjustors.length;i++)
                {
                    this._adjustors[i].hide();
                }
            }
        };
    }

    function _makeConnectorAdjustor(anchor, adjustCallback)
    {

        var parentView = anchor.parent;
        anchor.setAnimated(false);

        var moveButton = new BoxView({
            text: "", size: [30, 30], clickable: true, color: Colors.EditColor,
            position: [0, 0, 150], viewAlign: [0.5, 0.5], viewOrigin: [0.5, 0.5], fontSize: 'large'
        });

        anchor.add(moveButton.getModifier()).add(moveButton.getRenderController());
        moveButton.show();

        var dragController = new MouseSync();

        dragController.on('start',function(data){

        });

        dragController.on('update', function (data)
        {
            var offset = Vector.fromArray(data.delta);
            var newPos = Vector.fromArray(anchor.calculatePosition(parentView)).add(offset);
            var parentSize = Vector.fromArray(parentView.calculateSize());

            var newAlign = new Vector(0,0,0);
            newAlign.x = newPos.x/parentSize.x;
            newAlign.y = newPos.y/parentSize.y;

            newAlign.x = Math.max(Math.min(1,newAlign.x),0);
            newAlign.y = Math.max(Math.min(1,newAlign.y),0);

            function getError(value){
                if (value < 0.5)
                    return value;
                return 1-value;
            }

            if (getError(newAlign.x) < getError(newAlign.y))
                newAlign.x = Math.round(newAlign.x);
            else
                newAlign.y = Math.round(newAlign.y);

            anchor._eventOutput.emit('positionChange');

            anchor.setAlign(newAlign.toArray(2));
            anchor.requestLayout();
        });

        dragController.on('end',function(data){
            adjustCallback(anchor.viewAlign);
        }.bind(this));

        moveButton.textSurface.hide();
        moveButton.backSurface.pipe(dragController);


        return moveButton;

    }

});