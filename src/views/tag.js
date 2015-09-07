var React = require('react');

var Tag = React.createClass({
  render: function() {
    return <div>
      <hr/>
      <div className='tag'>{this.props.tag.tagName}</div>
    </div>;
  }
});

export default Tag;
