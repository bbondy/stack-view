var React = require('react');

var UserPage = React.createClass({
  render: function() {
    return <div>
      <h1>{this.props.user.displayName}</h1>
    </div>;
  }
});

export default UserPage;
