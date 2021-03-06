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
    var MouseSync = require('famous/inputs/MouseSync');

    function LineConnectorModule(parentController)
    {
        this.controller = parentController;
        this._objectsToHide = [];
        this._activeContexts = [];
        this._activeVertexCleanupFunctions = [];
        this._modelLoader = parentController.modelLoader;
    }

    module.exports = LineConnectorModule;


    LineConnectorModule.prototype.createUI = function(menu)
    {
        this.hide();

        var lineButton = MenuBar.makeToggleButton("Line");
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

    function _cleanupContext(context)
    {
        if (context && context.cleanupFunctions)
        {
            for (var i = 0; i < context.cleanupFunctions.length; i++)
            {
                context.cleanupFunctions[i]();
            }
        }
    }

    function _stopEditing()
    {
        for (var i=0;i<this._objectsToHide.length;i++)
        {
            var object =  this._objectsToHide[i];
            object.hide();
        }

        for (i=0;i<this._activeContexts.length;i++)
        {
            _cleanupContext(this._activeContexts[i]);
        }


        this._activeContexts = [];
        this._objectsToHide = [];
    }

    function _deactivateVertex()
    {
        if (!this._activeVertex)
            return;

        console.debug("Killing " + this._activeVertex.controller.getId());
        //this._activeVertex.button.setState(false);

        for (var i=0;i<this._activeVertexCleanupFunctions.length;i++)
        {
            this._activeVertexCleanupFunctions[i]();
        }

        this._activeVertex.button.show();
        this._activeVertex = undefined;
    }


    function _activateVertex(sourceVertex, destVertices, connectCallback)
    {
        if (this._activeVertex != sourceVertex)
            _deactivateVertex.call(this);

        console.debug("Activing " + sourceVertex.controller.getId());

        this._activeVertex = sourceVertex;

        this._activeVertex.button.hide();

        function prepareDestVertex(destVertex)
        {
            if (destVertex == sourceVertex)
                return;

            var oldListener = destVertex.button._listenerAction;
            destVertex.button._listenerAction = connectCallback.bind(this,destVertex);

            destVertex.button.show();

            this._activeVertexCleanupFunctions.push(function()
            {
                destVertex.button._listenerAction = oldListener;
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

            if (controller == this.controller)
                return;
            if (!controller.enableMode)
                return;

            var stateModeContext = {
                vertices:lineVertices
            };

            controller.enableMode("connectingLines",stateModeContext);

            this._activeContexts.push(stateModeContext);

        }.bind(this));

        for (var i=0;i<lineVertices.length;i++)
        {
            _prepareVertex.call(this,lineVertices[i],lineVertices);
        }
    }

    function _lineComplete(fromVertex,toVertex)
    {
        console.debug("Created line relationship");

        var lineObject = DynamicObject.create(this._modelLoader,DynamicObject.Types.ConnectingLine);

        var lineStart = Connection.create(this._modelLoader,Connection.Types.LineVertex);
        var lineEnd = Connection.create(this._modelLoader,Connection.Types.LineVertex);

        lineStart.properties.set("direction","outgoing");
        lineEnd.properties.set("direction","incoming");

        lineStart.createState(this.controller.getState());
        lineEnd.createState(this.controller.getState());

        lineStart.to = fromVertex.controller.getId();
        lineEnd.to = toVertex.controller.getId();

        lineObject.relationships.push(lineStart);
        lineObject.relationships.push(lineEnd);
        lineObject.createState(this.controller.getState());

        this._modelLoader.addObject(lineObject.id,lineObject);

        this.controller.objectDef.relationships.push(this._modelLoader.getModel().createString(lineObject.id));

    }

    function _prepareVertex(vertex, lineVertices)
    {
        var parentView = this.controller.getView();
        vertex.button.show();

        //var line = new LineCanvas();
        //parentView.add(line.getModifier()).add(line.getRenderController());
        //line.parent = parentView;

        var fromVertex = vertex.button;

        var activeDestVertex = undefined;
        vertex.button.on('click',function(){
            vertex.button._listenerAction();
        });

        function _connectCallback(destVertex)
        {
            if (destVertex)
                _lineComplete.call(this,this._activeVertex,destVertex);
        }

        vertex.button._listenerAction = _activateVertex.bind(this, vertex, lineVertices, _connectCallback.bind(this));

        //line.setLinePoints(fromVertex.calculatePosition(parentView), activeLineEnd.toArray());
    }



});