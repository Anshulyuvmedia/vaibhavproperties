<?php
// ----------------------------------------------------🔱🙏HAR HAR MAHADEV🔱🙏----------------------------------------------------
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RegisterUser;
use Auth, Hash, Exception;
use App\Models\Blog;
use App\Models\Lead;
use App\Models\Notification;
use App\Models\PropertyListing;
use App\Models\Master;
use Log;
use Laravel\Socialite\Facades\Socialite;
use Google_Client;
use Illuminate\Support\Facades\Validator;
use App\Notifications\BidLiveNotification;

class ApiMasterController extends Controller
{
    public function loginuser(Request $rq)
    {
        try {
            $user = RegisterUser::where('email', $rq->email)->first();
            if ($user) {
                if (Hash::check($rq->password, $user->password)) {
                    Auth::guard('customer')->login($user);
                    if (Auth::guard('customer')->check()) {
                        $user->verification_status = 1;
                        $user->save();

                        // Generate API token for authentication
                        $token = $user->createToken('AuthToken')->plainTextToken;
                        $response = [
                            'success' => true,
                            'token' => $token,
                            'data' => $user,
                            'message' => 'Login Successfully..!!!!!',
                        ];
                    } else {
                        $response = [
                            'success' => false,
                            'message' => 'Invalid..!!!!!',
                        ];
                    }
                } else {
                    $response = [
                        'success' => false,
                        'message' => 'Invalid Password..!!!',
                    ];
                }
            } else {
                $response = [
                    'success' => false,
                    'message' => 'Invalid Email..!!!',
                ];
            }
        } catch (Exception $e) {
            $response = [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }

        return response()->json($response);
    }

    public function registeruser(Request $rq)
    {
        $thumbnailFilename = null;

        try {
            // Check if email already exists
            if (RegisterUser::where('email', $rq->email)->exists()) {
                return response()->json(
                    [
                        'success' => false,
                        'message' => 'This email is already registered. Please use a different email or log in.',
                    ],
                    400,
                );
            }

            if ($rq->hasFile('company_document')) {
                $rq->validate([
                    'company_document' => 'required|mimes:jpeg,pdf,jpg',
                ]);

                $file = $rq->file('company_document');
                $thumbnailFilename = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('adminAssets/images/Users'), $thumbnailFilename);
            }

            $attributes = RegisterUser::create([
                'user_type' => $rq->user_type,
                'username' => $rq->name,
                'mobilenumber' => $rq->mobile,
                'email' => $rq->email,
                'city' => $rq->city,
                'state' => $rq->state,
                'bankname' => $rq->bankname,
                'company_name' => $rq->company_name,
                'company_document' => $thumbnailFilename,
                'password' => Hash::make($rq->password),
                'profile' => 'defaultuser.png',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'You have been Registered Successfully..!!!',
                'data' => $attributes,
            ]);
        } catch (Exception $e) {
            return response()->json(
                [
                    'success' => false,
                    'message' => 'Registration failed: ' . $e->getMessage(),
                ],
                500,
            );
        }
    }

    public function generateotp(Request $request)
    {
        // Log::info('Generate OTP Request:', $request->all());

        $validator = Validator::make($request->all(), [
            'mobilenumber' => 'required|digits:10',
        ]);

        if ($validator->fails()) {
            Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json(
                [
                    'success' => false,
                    'message' => $validator->errors()->first(),
                ],
                400,
            );
        }

        $credentials = $request->only('mobilenumber');
        $user = RegisterUser::where('mobilenumber', $credentials['mobilenumber'])->first();

        if ($user) {
            $otp = rand(100000, 999999);
            $user->update(['otp' => $otp]);

            // Log::info('OTP generated for user ID:', ['id' => $user->id, 'otp' => $otp]);
            return response()->json(
                [
                    'success' => true,
                    'data' => ['id' => $user->id, 'otp' => $otp], // Remove otp in production
                    'message' => 'OTP generated successfully',
                ],
                200,
            );
        }

        Log::warning('Mobile number not found:', $credentials);
        return response()->json(
            [
                'success' => false,
                'message' => 'Mobile number not found',
            ],
            404,
        );
    }

    public function verifyotp(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'loginformidval' => 'required|exists:register_users,id',
                '1' => 'required|digits:1',
                '2' => 'required|digits:1',
                '3' => 'required|digits:1',
                '4' => 'required|digits:1',
                '5' => 'required|digits:1',
                '6' => 'required|digits:1',
            ]);

            if ($validator->fails()) {
                return response()->json(
                    [
                        'success' => false,
                        'message' => $validator->errors()->first(),
                    ],
                    400,
                );
            }

            $user = RegisterUser::find($request->input('loginformidval'));
            // Use explicit key access to ensure correct digit order
            $enteredOtp = $request->input('1') . $request->input('2') . $request->input('3') . $request->input('4') . $request->input('5') . $request->input('6');
            // Log::info('Verifying OTP', ['user_id' => $user->id, 'stored_otp' => $user->otp, 'entered_otp' => $enteredOtp]);

            if ($user && $user->otp == $enteredOtp) {
                Auth::guard('customer')->login($user);
                $token = hash('sha256', $user->id . time() . $user->otp);

                return response()->json(
                    [
                        'success' => true,
                        'token' => $token,
                        'data' => $user,
                        'message' => 'Login Successfully..!!!!!',
                    ],
                    200,
                );
            }

            return response()->json(
                [
                    'success' => false,
                    'message' => 'OTP not verified',
                ],
                401,
            );
        } catch (Exception $e) {
            Log::error('OTP verification error: ' . $e->getMessage());
            return response()->json(
                [
                    'success' => false,
                    'message' => 'An error occurred during OTP verification: ' . $e->getMessage(),
                ],
                500,
            );
        }
    }

    public function blogs()
    {
        $blogs = Blog::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $blogs,
        ]);
    }

    public function propertylistings(Request $req)
    {
        $category = $req->query('filtercategory');
        $city = $req->query('filtercity');
        $minprice = $req->query('filterminprice');
        $maxprice = $req->query('filtermaxprice');

        $listings = PropertyListing::query();

        if ($category) {
            $listings->where('category', $category);
        }

        if ($city) {
            $listings->where('city', $city);
        }

        if ($minprice) {
            $listings->where('price', '>=', $minprice);
        }

        if ($maxprice) {
            $listings->where('price', '<=', $maxprice);
        }

        $listings = $listings->where('status', '=', 'published')->paginate(4);

        return response()->json([
            'success' => true,
            'data' => $listings,
        ]);
    }

    public function getcategories()
    {
        $categories = Master::where('type', 'Property Categories')->get();
        return response()->json([
            'success' => true,
            'categories' => $categories,
        ]);
    }

    public function propertydetails($id)
    {
        $propertydetails = PropertyListing::find($id);
        $bokerId = $propertydetails->roleid;
        $brokerdata = RegisterUser::select('username', 'profile', 'email', 'company_name', 'mobilenumber')->where('id', $bokerId)->where('user_type', 'broker')->where('verification_status', '1')->get();
        return response()->json([
            'success' => true,
            'brokerdata' => $brokerdata,
            'details' => $propertydetails,
        ]);
    }

    public function insertlisting(Request $request)
    {
        $datareq = $request->all();
        // \Log::info('Received Data:', $request->all());
        try {
            // Handle the thumbnail image
            $thumbnailFilename = null;
            if ($request->hasFile('thumbnailImages')) {
                $request->validate([
                    'thumbnailImages' => 'required|mimes:jpeg,png,jpg',
                ]);

                $file = $request->file('thumbnailImages');
                $thumbnailFilename = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('adminAssets/images/Listings'), $thumbnailFilename);
            }

            // Handle Master Plan Document
            $masterdoc = null;
            if ($request->hasFile('masterplandocument')) {
                $request->validate([
                    'masterplandocument' => 'required|mimes:pdf,jpeg,jpg',
                ]);

                $file = $request->file('masterplandocument');
                $masterdoc = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('adminAssets/images/Listings'), $masterdoc);
            }

            // \Log::info("Received Gallery Images", ['files' => $request->file('galleryImages')]);

            // Handle multiple gallery images
            $galleryImages = [];
            if ($request->hasFile('galleryImages')) {
                $request->validate([
                    'galleryImages.*' => 'required|image|mimes:jpeg,png,jpg',
                ]);
                foreach ($request->file('galleryImages') as $file) {
                    $imageName = md5(rand(1000, 10000)) . '.' . strtolower($file->getClientOriginalExtension());
                    $file->move(public_path('adminAssets/images/Listings'), $imageName);
                    $galleryImages[] = 'adminAssets/images/Listings/' . $imageName;
                }
            } else {
                // \Log::info("🚨 No gallery images detected in request.");
            }

            // Handle multiple documents
            $documents = [];
            if ($request->hasFile('documents')) {
                $request->validate([
                    'documents.*' => 'required|mimes:pdf,jpeg,jpg',
                ]);
                foreach ($request->file('documents') as $file) {
                    $docName = md5(rand(1000, 10000)) . '.' . strtolower($file->getClientOriginalExtension());
                    $file->move(public_path('adminAssets/images/Listings'), $docName);
                    $documents[] = 'adminAssets/images/Listings/' . $docName;
                }
            }

            // Handle multiple videos
            $Videos = [];
            if ($request->hasFile('propertyvideos')) {
                $request->validate([
                    'propertyvideos.*' => 'required|mimes:mp4,mov,avi',
                ]);
                foreach ($request->file('propertyvideos') as $file) {
                    $videoName = md5(rand(1000, 10000)) . '.' . strtolower($file->getClientOriginalExtension());
                    $file->move(public_path('adminAssets/images/Listings'), $videoName);
                    $Videos[] = 'adminAssets/images/Listings/' . $videoName;
                }
            }

            // Create the property listing (Ensure all fields are checked)
            $data = PropertyListing::create([
                'usertype' => $datareq['usertype'] ?? 'agent',
                'roleid' => $datareq['roleid'] ?? '4',
                'property_name' => $datareq['property_name'] ?? '',
                'nearbylocation' => $datareq['nearbylocation'] ?? '',
                'approxrentalincome' => $datareq['approxrentalincome'],
                'discription' => strip_tags($datareq['description'] ?? ''), // Remove HTML tags
                'price' => $datareq['price'] ?? '',
                'pricehistory' => json_encode(is_string($datareq['historydate']) ? json_decode($datareq['historydate'], true) : $datareq['historydate'] ?? []),
                'squarefoot' => $datareq['sqfoot'] ?? '',
                'bedroom' => $datareq['bedroom'] ?? '',
                'bathroom' => $datareq['bathroom'] ?? '',
                'floor' => $datareq['floor'] ?? '',
                'city' => $datareq['city'] ?? '',
                'address' => $datareq['officeaddress'] ?? '',
                'thumbnail' => $thumbnailFilename,
                'masterplandoc' => $masterdoc,
                'maplocations' => $datareq['location'] ?? ['Latitude' => '', 'Longitude' => ''],
                'category' => $datareq['category'] ?? '',
                'gallery' => json_encode($galleryImages),
                'documents' => json_encode($documents),
                'amenties' => $datareq['amenities'] ?? [],
                'videos' => json_encode($Videos),
                'status' => 'unpublished',
            ]);

            return response()->json(['data' => $data, 'message' => 'Listing inserted successfully!']);
        } catch (Exception $e) {
            return response()->json(['error' => true, 'message' => $e->getMessage()]);
        }
    }

    public function filterlistings(Request $req)
    {
        $category = $req->query('filtercategory');
        $city = $req->query('filtercity');
        $minprice = $req->query('filterminprice');
        $maxprice = $req->query('filtermaxprice');
        $sqftfrom = $req->query('sqftfrom');
        $sqftto = $req->query('sqftto');

        // Log::info('Filters:', [
        //     'category' => $category,
        //     'city' => $city,
        //     'minprice' => $minprice,
        //     'maxprice' => $maxprice,
        //     'sqftfrom' => $sqftfrom,
        //     'sqftto' => $sqftto,
        // ]);

        $listings = PropertyListing::query();

        if ($category) {
            $listings->where('category', $category)->orWhere('category', 'all');
        }

        if ($city) {
            $listings->where('city', $city);
        }

        if ($minprice && $maxprice) {
            $listings->whereBetween('price', [$minprice, $maxprice]);
        } elseif ($minprice) {
            $listings->where('price', '>=', $minprice);
        } elseif ($maxprice) {
            $listings->where('price', '<=', $maxprice);
        }

        if ($sqftfrom && $sqftto) {
            $listings->whereBetween('squarefoot', [$sqftfrom, $sqftto]);
        } elseif ($sqftfrom) {
            $listings->where('squarefoot', '>=', $sqftfrom);
        } elseif ($sqftto) {
            $listings->where('squarefoot', '<=', $sqftto);
        }
        $listings = $listings->where('status', '=', 'published')->get();

        return response()->json([
            'success' => true,
            'data' => $listings,
        ]);
    }

    public function sendenquiry(Request $rq)
    {
        try {
            $bidamount = $rq->bidamount;
            $currentdate = now();

            // Find existing lead
            $lead = Lead::where('propertyid', $rq->propertyid)->where('userid', $rq->userid)->first();

            // Get old bid history and append new bid
            // $bidHistory = [];
            // if ($lead && $lead->propertybid) {
            //     $bidHistory = json_decode($lead->propertybid, true) ?? [];
            // }
            $bidHistory[] = [
                'date' => $currentdate->toDateString(),
                'bidamount' => $bidamount,
            ];

            $data = Lead::updateOrCreate(
                ['propertyid' => $rq->propertyid, 'userid' => $rq->userid],
                [
                    'name' => $rq->customername,
                    'mobilenumber' => $rq->phone,
                    'email' => $rq->email,
                    'city' => $rq->city,
                    'state' => $rq->state,
                    'inwhichcity' => $rq->usercity,
                    'housecategory' => $rq->propertytype,
                    'propertyid' => $rq->propertyid,
                    'userid' => $rq->userid,
                    'agentid' => $rq->brokerid,
                    'propertybid' => json_encode($bidHistory),
                ],
            );
            return response()->json(['success' => true, 'data' => $data, 'message' => 'Enquiry Sent..!!!']);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function userprofile(Request $rq)
    {
        $userprofiledata = RegisterUser::find($rq->id);
        return response()->json(['success' => true, 'data' => $userprofiledata]);
    }

    public function updateuserprofile(Request $request, $id)
    {
        try {
            $user = RegisterUser::find($id);
            $filenameprofileimage = '';
            $thumbnailFilename = null;

            if ($request->hasFile('myprofileimage')) {
                $request->validate([
                    'myprofileimage' => 'image|mimes:jpeg,png,jpg|max:2048',
                ]);
                $profileimage = $request->file('myprofileimage');
                $filenameprofileimage = time() . '_' . $profileimage->getClientOriginalName();
                $profileimage->move(public_path('adminAssets/images/Users'), $filenameprofileimage);
            }

            if ($request->hasFile('company_document')) {
                $request->validate([
                    'company_document' => 'required|mimes:jpeg,pdf,jpg',
                ]);

                $file = $request->file('company_document');
                $thumbnailFilename = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('adminAssets/images/Users'), $thumbnailFilename);
            }

            $user->update([
                'username' => $request->name,
                'email' => $request->email,
                'mobilenumber' => $request->mobile,
                'company_name' => $request->company_name,
                'profile' => $filenameprofileimage == null ? $user->profile : $filenameprofileimage,
                'company_document' => $thumbnailFilename == null ? $user->company_document : $thumbnailFilename,
            ]);

            return response()->json(['success' => true, 'message' => 'Profile Updated..!!!', 'data' => $user]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function viewuserlistings(Request $rq)
    {
        $allproperties = PropertyListing::where('roleid', $rq->id)->orderBy('created_at', 'DESC')->get();
        $allpropertiescnt = PropertyListing::where('roleid', $rq->id)->count();
        return response()->json([
            'success' => true,
            'properties' => $allproperties,
            'count' => $allpropertiescnt,
        ]);
    }

    public function usernotifications(Request $rq)
    {
        // Fetch notifications with selected fields for the given user ID
        $notifications = Notification::select('data', 'notifiable_id', 'read_at', 'created_at')
            ->where('notifiable_id', $rq->id)
            ->orderBy('created_at', 'DESC')
            ->get();
        $notifycnt = Notification::where('notifiable_id', $rq->id)->count();

        // Collect unique property IDs
        $propertyIds = [];
        foreach ($notifications as $notification) {
            $notificationData = json_decode($notification->data, true);
            if (json_last_error() === JSON_ERROR_NONE && isset($notificationData['property_id'])) {
                $propertyIds[] = $notificationData['property_id'];
            }
        }
        $propertyIds = array_unique($propertyIds);

        // Fetch property data for all property IDs in one query
        $properties = [];
        if (!empty($propertyIds)) {
            $properties = PropertyListing::select('thumbnail', 'id', 'property_name', 'bidenddate')
                ->whereIn('id', $propertyIds)
                ->get()
                ->keyBy('id')
                ->toArray();
        }

        // Merge notifications with their related property data
        $mergedNotifications = $notifications->map(function ($notification) use ($properties) {
            $notificationData = json_decode($notification->data, true);
            $merged = $notification->toArray();
            
            // Add property data if property_id exists and property is found
            if (json_last_error() === JSON_ERROR_NONE && isset($notificationData['property_id'])) {
                $propertyId = $notificationData['property_id'];
                if (isset($properties[$propertyId])) {
                    $merged['property'] = $properties[$propertyId];
                } else {
                    $merged['property'] = null; // No property found for this ID
                }
            } else {
                $merged['property'] = null; // No valid property_id in notification
            }
            
            return $merged;
        })->toArray();

        return response()->json([
            'success' => true,
            'notifications' => $mergedNotifications,
            'count' => $notifycnt,
        ]);
    }

    public function listingscitywise()
    {
        $cityListings = PropertyListing::where('status', 'published')->get()->groupBy('city');

        $listingsbycitys = Master::where('type', 'City')->get();
        foreach ($listingsbycitys as $city) {
            $cityName = $city->label;

            $city->listings = $cityListings[$cityName] ?? collect();
            $city->property_count = $city->listings->count();
        }
        return response()->json([
            'success' => true,
            'data' => $listingsbycitys,
        ]);
    }

    public function updatelisting(Request $request, $id)
    {
        $datareq = $request->all();
        // \Log::info('Received Data:', $request->all());
        try {
            $olddata = PropertyListing::find($id);
            // Handle the thumbnail image
            $thumbnailFilename = null;
            if ($request->hasFile('thumbnailImages')) {
                $request->validate([
                    'thumbnailImages' => 'required|mimes:jpeg,png,jpg',
                ]);

                $file = $request->file('thumbnailImages');
                $thumbnailFilename = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('adminAssets/images/Listings'), $thumbnailFilename);
            }

            // Handle the Master Plan Doc
            $masterdoc = $olddata->masterplandoc;
            if ($request->hasFile('masterplandocument')) {
                $request->validate([
                    'masterplandocument' => 'required|mimes:pdf,jpeg,jpg',
                ]);

                $file = $request->file('masterplandocument');
                $masterdoc = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('adminAssets/images/Listings'), $masterdoc);
            }

            // Handle multiple gallery images (merge with old data)
            $galleryImages = json_decode($olddata->gallery, true) ?? [];
            if ($request->hasFile('galleryImages')) {
                $request->validate([
                    'galleryImages.*' => 'required|image|mimes:jpeg,png,jpg',
                ]);
                foreach ($request->file('galleryImages') as $file) {
                    $imageName = md5(rand(1000, 10000)) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('adminAssets/images/Listings'), $imageName);
                    $galleryImages[] = 'adminAssets/images/Listings/' . $imageName;
                }
            }

            // Handle multiple documents (merge with old data)
            $documents = json_decode($olddata->documents, true) ?? [];
            if ($request->hasFile('documents')) {
                $request->validate([
                    'documents.*' => 'required|mimes:pdf,jpeg,jpg',
                ]);
                foreach ($request->file('documents') as $file) {
                    $documentName = md5(rand(1000, 10000)) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('adminAssets/images/Listings'), $documentName);
                    $documents[] = 'adminAssets/images/Listings/' . $documentName;
                }
            }

            // Handle multiple Videos (merge with old data)
            $Videos = json_decode($olddata->videos, true) ?? [];
            if ($request->hasFile('propertyvideos')) {
                $request->validate([
                    'propertyvideos.*' => 'required|mimes:mp4,mov,avi',
                ]);
                foreach ($request->file('propertyvideos') as $file) {
                    $videoName = md5(rand(1000, 10000)) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('adminAssets/images/Listings'), $videoName);
                    $Videos[] = 'adminAssets/images/Listings/' . $videoName;
                }
            }

            $propertydata = PropertyListing::where('id', $id)->update([
                'roleid' => $datareq['roleid'],
                'property_name' => $datareq['property_name'],
                'nearbylocation' => $datareq['nearbylocation'],
                'approxrentalincome' => $datareq['approxrentalincome'],
                'discription' => strip_tags($datareq['description'] ?? ''), // Remove HTML tags
                'price' => $datareq['price'],
                'pricehistory' => $datareq['historydate'],
                'squarefoot' => $datareq['sqfoot'],
                'bedroom' => $datareq['bedroom'],
                'bathroom' => $datareq['bathroom'],
                'floor' => $datareq['floor'],
                'city' => $datareq['city'],
                'address' => $datareq['officeaddress'],
                'thumbnail' => $thumbnailFilename ?? $olddata->thumbnail,
                'masterplandoc' => $masterdoc ?? $olddata->masterdoc,
                'maplocations' => $datareq['location'] ?? $olddata->maplocations,
                'category' => $datareq['category'],
                'gallery' => !empty($galleryImages) ? json_encode($galleryImages) : $olddata->gallery,
                'documents' => !empty($documents) ? json_encode($documents) : $olddata->documents,
                'amenties' => $datareq['amenities'] ?? $olddata->amenities,
                'videos' => !empty($Videos) ? json_encode($Videos) : $olddata->videos,
                'status' => 'unpublished',
            ]);
            $updatedProperty = PropertyListing::where('id', $id)->first(); // Fetch updated record
            return response()->json(['data' => $updatedProperty, 'message' => 'Listing Updated successfully!']);
        } catch (Exception $e) {
            return response()->json(['error' => true, 'message' => $e->getMessage()]);
        }
    }

    public function deletefile(Request $request)
    {
        // Log::info("Delete request received:", $request->all());

        try {
            $request->validate([
                'property_id' => 'required|exists:property_listings,id',
                'file_type' => 'required|in:thumbnail,gallery,video,document,masterplan',
                'file_path' => 'required|string',
            ]);

            $property = PropertyListing::find($request->property_id);
            if (!$property) {
                return response()->json(['error' => true, 'message' => 'Property not found.']);
            }

            // Normalize file path (remove escaped slashes)
            $filePath = str_replace('\/', '/', $request->file_path);
            $absoluteFilePath = public_path($filePath);

            // Log::info("Attempting to delete file at: " . $absoluteFilePath);

            // Check if the file exists and delete it
            if (file_exists($absoluteFilePath)) {
                unlink($absoluteFilePath);
                // Log::info("File deleted successfully: " . $absoluteFilePath);
            } else {
                Log::warning('File not found: ' . $absoluteFilePath);
            }

            // Handle different file types and update the database
            switch ($request->file_type) {
                case 'thumbnail':
                    $property->thumbnail = null;
                    break;
                case 'gallery':
                    $galleryImages = json_decode($property->gallery, true) ?? [];
                    $galleryImages = array_values(
                        array_filter($galleryImages, function ($img) use ($filePath) {
                            return trim(str_replace('\/', '/', $img)) !== trim($filePath);
                        }),
                    );
                    $property->gallery = json_encode($galleryImages);
                    break;
                case 'video':
                    $videos = json_decode($property->videos, true) ?? [];
                    $videos = array_values(
                        array_filter($videos, function ($vid) use ($filePath) {
                            return trim(str_replace('\/', '/', $vid)) !== trim($filePath);
                        }),
                    );
                    $property->videos = json_encode($videos);
                    // Log::info("Updated videos list: " . json_encode($videos));
                    break;
                case 'document':
                    $documents = json_decode($property->documents, true) ?? [];
                    $documents = array_values(
                        array_filter($documents, function ($doc) use ($filePath) {
                            return trim(str_replace('\/', '/', $doc)) !== trim($filePath);
                        }),
                    );
                    $property->documents = json_encode($documents);
                    // Log::info("Updated documents list: " . json_encode($documents));
                    break;
                case 'masterplan':
                    $masterPlans = json_decode($property->masterplandoc, true) ?? [];
                    $masterPlans = array_values(
                        array_filter($masterPlans, function ($doc) use ($filePath) {
                            return trim(str_replace('\/', '/', $doc)) !== trim($filePath);
                        }),
                    );
                    $property->masterplandoc = json_encode($masterPlans);
                    // Log::info("Updated master plan list: " . json_encode($masterPlans));
                    break;
            }

            $property->save();

            return response()->json(['message' => 'File deleted successfully']);
        } catch (Exception $e) {
            Log::error('File delete error: ' . $e->getMessage());
            return response()->json(['error' => true, 'message' => 'Failed to delete file.']);
        }
    }

    // **WEB LOGIN - Redirects to Google for Authentication**
    public function googleLogin()
    {
        return Socialite::driver('google')->redirect();
    }

    // **WEB AUTHENTICATION - Handles Callback from Google**
    public function GoogleAuth()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            $user = RegisterUser::where('google_id', $googleUser->id)->orWhere('email', $googleUser->email)->first();

            if ($user) {
                Auth::guard('customer')->login($user);
                $user->update(['verification_status' => 1]);
                return redirect()->route('website.homepage')->with('success', 'You are logged in successfully');
            }

            return redirect()->route('website.userlogin')->with('error', 'This user is not registered');
        } catch (Exception $exception) {
            return redirect()
                ->route('website.userlogin')
                ->with('error', 'Something went wrong: ' . $exception->getMessage());
        }
    }

    // **API LOGIN/REGISTER - Handles Google Sign-In for Mobile Apps / Frontend**
    public function appGoogleAuth(Request $request)
    {
        try {
            $request->validate(['token' => 'required|string']);

            // Verify token with Google API
            $googleUser = Http::get('https://www.googleapis.com/oauth2/v3/userinfo', [
                'access_token' => $request->token,
            ])->json();

            if (!isset($googleUser['sub'])) {
                return response()->json(['success' => false, 'message' => 'Invalid Google token'], 401);
            }

            // Check if user exists
            $user = RegisterUser::where('google_id', $googleUser['sub'])->orWhere('email', $googleUser['email'])->first();

            if (!$user) {
                // Register new user
                $user = RegisterUser::create([
                    'username' => $googleUser['name'],
                    'email' => $googleUser['email'],
                    'google_id' => $googleUser['sub'],
                    'user_type' => $request->user_type ?? 'default',
                    'verification_status' => 1,
                    'profile' => $googleUser['picture'] ?? 'public/adminAssets/images/defaultuser.png',
                    'password' => Hash::make(uniqid()),
                ]);
            }

            // Log in the user
            Auth::guard('customer')->login($user);

            // Generate API token for mobile/web
            $apiToken = $user->createToken('authToken')->plainTextToken;

            return response()->json(
                [
                    'success' => true,
                    'message' => 'User authenticated successfully',
                    'token' => $apiToken,
                    'data' => $user,
                ],
                200,
            );
        } catch (Exception $exception) {
            return response()->json(['success' => false, 'message' => 'Something went wrong', 'error' => $exception->getMessage()], 500);
        }
    }

    // **API REGISTER - Handles Google Registration**
    public function googleRegister(Request $request)
    {
        try {
            $client = new Google_Client(['client_id' => config('services.google.client_id')]);
            $payload = $client->verifyIdToken($request->id_token);

            if (!$payload) {
                return response()->json(['error' => 'Invalid ID Token'], 400);
            }

            $googleId = $payload['sub'];
            $email = $payload['email'];
            $name = $payload['username'];
            $avatar = $payload['picture'] ?? 'public/adminAssets/images/defaultuser.png';
            $userType = $request->user_type ?? 'default';

            $user = RegisterUser::where('email', $email)->first();

            if ($user) {
                return response()->json(['message' => 'User already exists'], 409);
            }

            $newUser = RegisterUser::create([
                'username' => $name,
                'user_type' => $userType,
                'email' => $email,
                'google_id' => $googleId,
                'verification_status' => 1,
                'profile' => $avatar,
                'password' => Hash::make(uniqid()),
            ]);

            return response()->json(['message' => 'Registered Successfully', 'user' => $newUser], 201);
        } catch (Exception $e) {
            return response()->json(['error' => 'Something went wrong', 'message' => $e->getMessage()], 500);
        }
    }

    public function brokerlist()
    {
        $brokerlistdata = RegisterUser::select('username', 'profile', 'id', 'mobilenumber', 'city')->where('user_type', 'broker')->where('verification_status', '1')->get();
        
        return response()->json(['success' => true, 'data' => $brokerlistdata]);
    }
    public function brokerprofile(Request $rq)
    {
        $brokerdata = RegisterUser::select('username', 'profile', 'email', 'company_name', 'mobilenumber')->where('id', $rq->id)->where('user_type', 'broker')->where('verification_status', '1')->get();

        $allproperties = PropertyListing::select('property_name', 'id', 'price', 'city', 'thumbnail', 'category')->where('roleid', $rq->id)->where('status', 'published')->orderBy('created_at', 'DESC')->get();

        return response()->json([
            'success' => true,
            'brokerdata' => $brokerdata,
            'allproperties' => $allproperties,
        ]);
    }

    public function fetchenquiries(Request $rq)
    {
        try {
            $myenquiries = Lead::where('userid', $rq->id)->where('form_type', '=', 'broker')->get();

            $brokerenquiries = Lead::where('agentid', $rq->id)->where('form_type', '=', 'broker')->get();

            $loanenquiries = Lead::where('form_type', '=', 'bankagent')->get();

            return response()->json([
                'success' => true,
                'myenquiries' => $myenquiries,
                'brokerenquiries' => $brokerenquiries,
                'loanenquiries' => $loanenquiries,
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function bankagentlist()
    {
        $bankagentlistdata = RegisterUser::select('username', 'profile', 'id')->where('user_type', 'bankagent')->where('verification_status', '1')->get();
        return response()->json(['success' => true, 'data' => $bankagentlistdata]);
    }
    public function bankagentprofile(Request $rq)
    {
        $agentdata = RegisterUser::select('username', 'profile', 'email', 'company_name')->where('id', $rq->id)->where('user_type', 'bankagent')->where('verification_status', '1')->get();

        return response()->json([
            'success' => true,
            'agentdata' => $agentdata,
        ]);
    }

    public function sendloanenquiry(Request $rq)
    {
        try {
            // Validate request data
            $rq->validate([
                'customername' => 'required|string',
                'mobilenumber' => 'required|string|regex:/^[0-9]{10}$/',
                'email' => 'required|email',
                'city' => 'required|string',
                'state' => 'nullable|string',
                'form_type' => 'required|string',
                'loan_amount' => 'required|numeric|min:0',
                'documents.*' => 'required|mimes:pdf,jpeg,jpg',
            ]);

            // Handle multiple documents
            $documents = [];
            if ($rq->hasFile('documents')) {
                $files = $rq->file('documents');
                foreach ($files as $file) {
                    $documentname = md5(rand(1000, 10000));
                    $extension = strtolower($file->getClientOriginalExtension());
                    $documentfullname = $documentname . '.' . $extension;
                    $uploadedPath = public_path('assets/images/EnquiryDocs');
                    $file->move($uploadedPath, $documentfullname);
                    $documents[] = 'assets/images/EnquiryDocs/' . $documentfullname;
                }
            }

            // Create Lead
            $data = Lead::create([
                'userid' => $rq->userid,
                'name' => $rq->customername,
                'mobilenumber' => $rq->mobilenumber,
                'email' => $rq->email,
                'city' => $rq->city,
                'state' => $rq->state,
                'documents' => !empty($documents) ? json_encode($documents) : null,
                'form_type' => $rq->form_type,
                'loan_amount' => $rq->loan_amount,
            ]);

            return response()->json(
                [
                    'success' => true,
                    'data' => $data,
                ],
                200,
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(
                [
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ],
                422,
            );
        } catch (\Exception $e) {
            \Log::error('Loan enquiry error: ' . $e->getMessage());
            return response()->json(
                [
                    'success' => false,
                    'message' => 'Server error occurred',
                ],
                500,
            );
        }
    }

    public function UpdateBidStatus(Request $request)
    {
        try {
            $property = PropertyListing::findOrFail($request->propertyid);
            $property->update([
                'bidstatus' => $request->bidliveStatus,
                'bidenddate' => $request->bidEnddate ?? $property->bidenddate,
            ]);

            if ($request->bidliveStatus === 'on') {
                $recipients = RegisterUser::whereIn('user_type', ['user', 'broker'])->get();
                foreach ($recipients as $user) {
                    $user->notify(new BidLiveNotification($property));
                }
                Log::info('Notifications are sent!');
            }

            return response()->json(['success' => true, 'message' => 'Bid is Live now'], 200);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'error' => 'Failed to update bid status: ' . $e->getMessage()], 500);
        }
    }

    public function UpdateBidAmount(Request $request)
    {
    try {
        $leads = Lead::findOrFail($request->leadid);
        $existingBids = json_decode($leads->propertybid, true);

        foreach ($existingBids as &$bid) {
                if ($bid['date'] == $request->biddate) {
                $bid['bidamount'] = $request->bidamount;
                $bid['date'] = now()->toDateString();
            }
        }
        $leads->update([
        'propertybid' => json_encode($existingBids),
        ]);

    return response()->json(['success' => true, 'message' => 'Bid Updated'], 200);
    } catch (Exception $e) {
            return response()->json(['success' => false, 'error' => 'Failed to update bid status: ' . $e->getMessage()], 500);
        }
    }
}
