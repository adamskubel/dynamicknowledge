define(function(require,exports,module){


    var LineCanvas = require('Views/LineCanvas');

    function LineDrawingAttachment()
    {

    }

    module.exports = LineDrawingAttachment;

    LineDrawingAttachment.attach = function(pview)
    {

    };

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

});
