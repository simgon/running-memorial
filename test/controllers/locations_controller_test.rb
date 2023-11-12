require 'test_helper'

class LocationsControllerTest < ActionDispatch::IntegrationTest
  def setup
    @route = routes(:route1)
  end

  test 'should create locations' do
    location_params = {
      route_param: {
        routeId: @route.id,
        locations: [
          { 'lat_loc' => 12.34, 'lon_loc' => 56.78 },
          { 'lat_loc' => 23.45, 'lon_loc' => 67.89 }
        ]
      }
    }
    post locations_path, params: location_params
    assert_response :success
    assert_equal 2, @route.locations.count
  end
end
