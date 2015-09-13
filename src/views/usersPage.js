var React = require('react');
import User from './user.js';

var UsersPage = React.createClass({
  render: function() {
    return <div className='sectionContainer'>
      <h1>Users</h1>
      {
        this.props.users.map(user => <User key={user.id}
          siteSlug={this.props.siteSlug}
          id={user.id}
          displayName={user.displayName}
          lang={this.props.lang} />)
      }
    </div>;
  }
});

export default UsersPage;

