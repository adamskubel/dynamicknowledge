define(function(require,exports,module){

    var BoxView = require('PositioningLayouts/BoxView');

    function LineConnectionModule()
    {

    }


    LineConnectionModule.prototype.createUI = function(){

        var addConnectionButton = new BoxView({
            text: ">>", size: [40, 40], clickable: true, color: Colors.EditColor,
            position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 0], fontSize: 'large'
        });
        addConnectionButton.on('click', _showConnections.bind(this));


    };


    //Connection stuff
    function _showConnections()
    {
        var inputs = this.controller.getInputs();
        var outputs = this.controller.getOutputs();

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
                if (!out.hasOwnProperty(name)) continue;
                _addLineDrawingToAnchor.call(this, out[name], getInputs(name), name);
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

    function _addLineDrawingToAnchor(sourceAnchor, destinations, connectionName)
    {
        var parentView = this.getView();

        sourceAnchor.show();

        var lineSync = new MouseSync({
            propogate: true
        });

        var line = new LineCanvas();
        parentView.add(line.getModifier()).add(line.getRenderController());

        line.parent = parentView;

        lineSync.on('start', function (data)
        {
            _configureDestinationAnchors.call(this, sourceAnchor, destinations);
            sourceAnchor.activeLineEnd = Vector.fromArray(sourceAnchor.calculatePosition(parentView));
        }.bind(this));

        lineSync.on('update', function (data)
        {
            sourceAnchor.activeLineEnd = Vector.fromArray(data.delta).add(sourceAnchor.activeLineEnd);
            line.setLinePoints(sourceAnchor.calculatePosition(parentView), sourceAnchor.activeLineEnd.toArray());
        });

        lineSync.on('end', function (data)
        {
            var destAnchor = sourceAnchor.activeReceiver;
            if (destAnchor)
            {
                _viewConnected.call(this,{ from:sourceAnchor.parent, to:destAnchor.parent, type: connectionName});
            }
            line.hide();
            sourceAnchor._eventOutput.emit('draw_end', destAnchor);
        }.bind(this));

        sourceAnchor.backSurface.pipe(lineSync);
        sourceAnchor.textSurface.pipe(lineSync);
        sourceAnchor._drawMouseSync = lineSync;
    }

    module.exports = LineConnectionModule;

});