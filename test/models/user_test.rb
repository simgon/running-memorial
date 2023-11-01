require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "should be valid" do
    user = users(:user1)
    user.password = "password"
    assert user.valid?
  end
end
