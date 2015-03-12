define(function(require,exports,module)
{

    var Utils = require('Utils');
    var ListSelector = require('Views/ListSelector');
    var MenuBar = require('Views/MenuBar');
    var Colors = require('Colors');
    var LineCanvas = require('Views/LineCanvas');
    var Vector = require('ProperVector');
    var DynamicObject = require('Model/DynamicObject');
    var Connection = require('Model/Connection');

    function LineConnectorModule(parentController)
    {
        this.controller = parentController;
        this._objectsToHide = [];
        this._activeVertexCleanupFunctions = [];
        this._modelLoader = parentController.modelLoader;
    }


    LineConnectorModule.prototype.createUI = function(menu)
    {
        this.hide();

        var lineButton = MenuBar.makeMenuButton("Line");
        lineButton.on('toggleOn',_startEditing.bind(this));
        lineButton.on('toggleOff',_stopEditing.bind(this));

        this._hideObjectFunction = function()
        {
            menu.removeChild(lineButton);
        };

        menu.addChild(lineButton);

        this._hideObjectFunction = function()
        {
            menu.removeChild(lineButton);
        }
    };

    LineConnectorModule.prototype.hide = function()
    {
        _stopEditing.call(this);
        if (this._hideObjectFunction)
            this._hideObjectFunction();
    };

    function _stopEditing()
    {
        for (var i=0;i<this._objectsToHide.length;i++)
        {
            var object =  this._objectsToHide[i];
            object.hide();
        }

        this._objectsToHide = [];
    }

    function _deactivateVertex()
    {
        if (!this._activeVertex)
            return;

        this._activeVertex.button.setState(false);

        for (var i=0;i<this._activeVertexCleanupFunctions.length;i++)
        {
            this._activeVertexCleanupFunctions[i]();
        }

        this._activeVertex = undefined;
    }


    function _activateVertex(sourceVertex, destVertices, connectCallback)
    {
        if (this._activeVertex != sourceVertex)
            _deactivateVertex.call(this);

        this._activeVertex = sourceVertex;


        function prepareDestVertex(destVertex)
        {
            var activeDest = undefined;

            var moveListener = function ()
            {
                if (activeDest !== destVertex)
                {
                    activeDest = destVertex;
                    connectCallback(activeDest);
                }
            };

            var leaveListener = function ()
            {
                if (activeDest === destVertex)
                {
                    activeDest = undefined;
                    connectCallback(activeDest);
                }
            };

            destVertex.button.show();
            destVertex.button.textSurface.on('mousemove',moveListener);
            destVertex.button.backSurface.on('mouseleave',leaveListener);

            this._activeVertexCleanupFunctions.push(function()
            {
                destVertex.button.textSurface.removeListener('mousemove',moveListener);
                destVertex.button.backSurface.removeListener('mouseleave', leaveListener);
                destVertex.button.hide();
            });
        }

        for (var i=0;i<destVertices.length;i++)
        {
            prepareDestVertex.call(this, destVertices[i]);
        }
    }

    function _startEditing()
    {
        var lineVertices = [];

        this.controller.visitAll(function(controller){

            if (!controller.enableMode)
                return;

            var stateModeContext = {
                vertices:lineVertices
            };

            controller.enableMode("connectingLines",stateModeContext);
        });

        for (var i=0;i<lineVertices.length;i++)
        {
            this._objectsToHide.push(lineVertices[i].button);
            _prepareVertex.call(this,lineVertices[i],lineVertices);
        }
    }

    function _lineComplete(fromVertex,toVertex)
    {
        var lineObject = DynamicObject.create(this._modelLoader,"connectingLine");

        var lineStart = Connection.create(this._modelLoader,"lineConnector");
        var lineEnd = Connection.create(this._modelLoader,"lineConnector");

        lineStart.properties.set("direction","outgoing");
        lineEnd.properties.set("direction","incoming");

        lineStart.createState(this.controller.getState());
        lineEnd.createState(this.controller.getState());

        lineStart.to = fromVertex;
        lineEnd.to = toVertex;

        lineObject.relationships.push(lineStart);
        lineObject.relationships.push(lineEnd);

        this._modelLoader.addObject(lineObject.id,lineObject);
    }

    function _prepareVertex(vertex, lineVertices)
    {
        var parentView = this.controller.getView();

        var lineSync = new MouseSync({
            propogate: true
        });

        var line = new LineCanvas();
        parentView.add(line.getModifier()).add(line.getRenderController());
        line.parent = parentView;

        var fromVertex = vertex.button;
        var activeLineEnd = new Vector(0,0,0);

        var activeDestVertex = undefined;

        function _connectCallback(destVertex)
        {
            activeDestVertex = destVertex;
        }

        lineSync.on('start', function (data)
        {
            _activateVertex.call(this, vertex, lineVertices, _connectCallback.bind(this));
            activeLineEnd = Vector.fromArray(fromVertex.calculatePosition(parentView));
        }.bind(this));

        lineSync.on('update', function (data)
        {
            activeLineEnd = Vector.fromArray(data.delta).add(activeLineEnd);
            line.setLinePoints(fromVertex.calculatePosition(parentView), activeLineEnd.toArray());
        });

        lineSync.on('end', function (data)
        {
            if (activeDestVertex)
            {
                _lineComplete.call(this,this._activeVertex,activeDestVertex);
            }
            line.hide();
            _deactivateVertex.call(this);
        }.bind(this));

        fromVertex.backSurface.pipe(lineSync);
        fromVertex.textSurface.pipe(lineSync);
        fromVertex._drawMouseSync = lineSync;
    }



});