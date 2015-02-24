define(function(require,exports,module){

    var DynamicContainer = require('PositioningLayouts/DynamicContainer');
    var BoxView = require('PositioningLayouts/BoxView');

    var MouseSync = require('famous/inputs/MouseSync');
    var Vector = require('ProperVector');
    var LineCanvas = require('./../LineCanvas');
    var Colors = require('Colors');

    var AccessInspector = require('intrinsics/AccessInspector');

    function DynamicGroupController(groupDef)
    {
        this.objectDef = groupDef;
        this.controllers = [];
        this.state = 'base';
    }

    DynamicGroupController.prototype.addController = function(controller)
    {
        if (this.containerView)
            _addController.call(this,this.containerView,controller);

        this.controllers.push(controller);
        controller.setState(this.state);
        controller.setEditMode(this.editMode);

    };

    DynamicGroupController.prototype.setEditMode = function(editMode)
    {
        this.editMode = editMode;
        for (var i=0;i<this.controllers.length;i++)
        {
            this.controllers[i].setEditMode(editMode);
        }

        if (editMode == "IsEditing")
        {
            _showEditUI.call(this, this.containerView);
        }
        else
        {
            _hideEditUI.call(this);
        }
    };

    DynamicGroupController.prototype.setState = function(state){
        this.state = state;

        for (var i=0;i<this.controllers.length;i++)
        {
            this.controllers[i].setState(state);
        }
    };

    DynamicGroupController.prototype.getView = function(){
        if (!this.containerView)
            this.containerView = _makeContainerView.call(this);

        return this.containerView;
    };

    DynamicGroupController.prototype.getObjectDef = function(){
        return this.objectDef;
    };

    DynamicGroupController.prototype.getOutputs = function()
    {
        var outputs = [];
        for (var i=0;i<this.controllers.length;i++)
        {
            if (this.controllers[i].getOutputs)
            {
                var c = this.controllers[i].getOutputs();
                if (c instanceof Array)
                {
                    for (var j=0;j< c.length;j++)
                        outputs.push(c[j]);
                }
                else if (c)
                    outputs.push(c);
            }
        }
        return outputs;
    };

    DynamicGroupController.prototype.getInputs = function()
    {
        var inputs = [];
        for (var i=0;i<this.controllers.length;i++)
        {
            if (this.controllers[i].getInputs)
            {
                var c = this.controllers[i].getInputs();
                if (c instanceof Array)
                {
                    for (var j=0;j< c.length;j++)
                        inputs.push(c[j]);
                }
                else if (c)
                    inputs.push(c);
            }
        }
        return inputs;
    };

    function _makeContainerView()
    {
        var dc = new DynamicContainer();

        for (var i=0;i<this.controllers.length;i++)
        {
            _addController(dc,this.controllers[i]);
        }

        var containerBackground = new BoxView({
            color: 2000,
            style: 'borderOnly',
            size: [undefined,undefined]
        });

        dc.add(containerBackground.getModifier()).add(containerBackground.getRenderController());

        return dc;
    }

    function _addController(dc,controller)
    {
        var controllerView = controller.getView(dc);

        if (controllerView != dc)
            dc.addChild(controllerView);
    }

    function _hideEditUI()
    {
        if (this.addConnectionButton)
            this.addConnectionButton.hide();
        if (this.addObjectButton)
            this.addObjectButton.hide();
    }

    function _showEditUI(dc)
    {
        if (!this.addConnectionButton)
        {
            var addObjectButton = new BoxView({
                text: "+", size: [40, 40], clickable: true, color: Colors.EditColor,
                position: [80, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 1], fontSize: 'large'
            });

            var addConnectionButton = new BoxView({
                text: ">>", size: [40, 40], clickable: true, color: Colors.EditColor,
                position: [40, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 1], fontSize: 'large'
            });

            addConnectionButton.on('click', _showConnections.bind(this));
            addObjectButton.on('click',_addObject.bind(this));

            this.addConnectionButton = addConnectionButton;
            dc.add(addConnectionButton.getModifier()).add(addConnectionButton.getRenderController());

            this.addObjectButton = addObjectButton;
            dc.add(addObjectButton.getModifier()).add(addObjectButton.getRenderController());
        }

        this.addObjectButton.show();
        this.addConnectionButton.show();
    }

    function _addObject()
    {
        var newObj = new AccessInspector();


    }

    //Connection stuff
    function _showConnections()
    {
        var inputs = this.getInputs();
        var outputs = this.getOutputs();

        function getInputs(eventName)
        {
            var destinations = [];
            for (var x=0;x<inputs.length;x++)
            {
                if (inputs[x][eventName])
                    destinations.push(inputs[x][eventName]);
            }
            return destinations;
        }

        for (var i=0;i<outputs.length;i++)
        {
            var out = outputs[i];
            for (var name in out)
            {
                console.log("Adding line drawing to anchor with name: " + name);
                _addLineDrawingToAnchor.call(this, out[name],getInputs(name));
            }
        }
    }

    function _configureDestinationAnchors(originAnchor, destinations)
    {
        for (var i=0;i<destinations.length;i++)
        {
            destinations[i].show();
            destinations[i].pulse(500,5000);
            _addReceivingAnchors(originAnchor,destinations[i]);
        }
    }

    function _addReceivingAnchors(originAnchor, destAnchor)
    {
        destAnchor.textSurface.on('mousemove', function ()
        {
            originAnchor.activeReceiver = destAnchor;
        });

        destAnchor.backSurface.on('mouseleave', function ()
        {
            originAnchor.activeReceiver = undefined;
        });

        originAnchor.on('draw_end', function (activeReceiver)
        {
            if (destAnchor != activeReceiver)
                destAnchor.hide();
        });
    }

    function _addLineDrawingToAnchor(sourceAnchor, destinations)
    {
        var dc = this.containerView;

        sourceAnchor.show();

        var lineSync = new MouseSync({
            propogate: true
        });

        var line = new LineCanvas();
        dc.add(line.getModifier()).add(line);

        sourceAnchor.activeLine = line;
        sourceAnchor.activeLine.parent = dc;

        lineSync.on('start', function (data)
        {
            _configureDestinationAnchors.call(this, sourceAnchor, destinations);
            sourceAnchor.activeLineEnd = Vector.fromArray(sourceAnchor.calculatePosition(dc));
        }.bind(this));

        lineSync.on('update', function (data)
        {
            sourceAnchor.activeLineEnd = Vector.fromArray(data.delta).add(sourceAnchor.activeLineEnd);
            sourceAnchor.activeLine.setLinePoints(sourceAnchor.calculatePosition(dc), sourceAnchor.activeLineEnd.toArray());
        });

        lineSync.on('end', function (data)
        {
            if (sourceAnchor.activeReceiver)
            {
                console.log("Binding to " + sourceAnchor.activeReceiver._globalId);
                sourceAnchor.parent.on('positionChange', function ()
                {
                    sourceAnchor._eventOutput.emit('positionChange');
                });
                sourceAnchor.activeLine.setLineObjects(sourceAnchor, sourceAnchor.activeReceiver);
            }
            sourceAnchor._eventOutput.emit('draw_end', sourceAnchor.activeReceiver);
        });

        sourceAnchor.backSurface.pipe(lineSync);
        sourceAnchor.textSurface.pipe(lineSync);
        sourceAnchor._drawMouseSync = lineSync;
    }

    module.exports = DynamicGroupController;
});